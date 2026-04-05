import type { Prompt, PromptStorageData } from '../storage';
import type { Tab, Settings } from './types';

export type PromptAction =
  | { type: 'SET_DATA'; payload: PromptStorageData }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'MOVE_ITEM_IN_LIST'; tab: Tab; fromIndex: number; toIndex: number }
  | { type: 'MOVE_PROMPT'; from: Tab; to: Tab; index: number; targetTab?: Tab }
  | { type: 'DELETE_PROMPT'; tab: Tab; index: number }
  | { type: 'UPDATE_PROMPT'; tab: Tab; index: number; prompt: Prompt }
  | { type: 'INSERT_PROMPT'; tab: Tab; index: number; prompt: Prompt }
  | { type: 'UPDATE_SETTINGS'; settings: Settings }
  | { type: 'PUSH_STATE'; payload: PromptStorageData }
  | { type: 'STAGE_PROMPT'; tab: Tab; index: number };

export interface PromptState {
  present: PromptStorageData;
  past: PromptStorageData[];
  future: PromptStorageData[];
}

export const INITIAL_PROMPT_STATE: PromptState = {
  present: {
    main: [],
    notes: [],
    archive: [],
    canned: [],
    snippets: [],
    settings: {
      tabVisibility: {
        main: true,
        notes: true,
        canned: true,
        snippets: true,
        archive: true,
        settings: true,
      },
      slashCommands: [],
    }
  },
  past: [],
  future: [],
};

export function promptReducer(state: PromptState, action: PromptAction): PromptState {
  switch (action.type) {
    case 'SET_DATA':
      return {
        present: action.payload,
        past: [],
        future: [],
      };

    case 'PUSH_STATE':
      return {
        past: [...state.past, state.present],
        present: action.payload,
        future: [],
      };

    case 'UNDO': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1]!;
      const newPast = state.past.slice(0, state.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0]!;
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      };
    }

    case 'MOVE_ITEM_IN_LIST': {
      const { tab, fromIndex, toIndex } = action;
      if (tab === 'archive' || tab === 'settings') return state;
      if (fromIndex === toIndex) return state;
      const list = [...(state.present[tab] as Prompt[])];
      const movedItem = list.splice(fromIndex, 1)[0];
      if (!movedItem) return state;
      list.splice(toIndex, 0, movedItem);

      return {
        past: [...state.past, state.present],
        present: { ...state.present, [tab]: list },
        future: [],
      };
    }

    case 'MOVE_PROMPT': {
      const { from, to, index, targetTab } = action;
      if (from === 'settings' || to === 'settings') return state;
      const fromList = [...(state.present[from] as Prompt[])];
      const toList = [...(state.present[to] as Prompt[])];
      const [prompt] = fromList.splice(index, 1);

      if (!prompt) return state;

      let nextPresent: PromptStorageData;
      if (from === 'archive' && targetTab && targetTab !== 'settings') {
        const actualTargetList = [...(state.present[targetTab] as Prompt[])];
        actualTargetList.push(prompt);
        nextPresent = {
          ...state.present,
          archive: fromList,
          [targetTab]: actualTargetList,
        };
      } else {
        let promptToInsert = prompt;
        if (to === 'archive') {
          promptToInsert = { ...prompt, staged: false };
          toList.unshift(promptToInsert);
        } else {
          toList.push(promptToInsert);
        }
        nextPresent = {
          ...state.present,
          [from]: fromList,
          [to]: toList,
        };
      }

      return {
        past: [...state.past, state.present],
        present: nextPresent,
        future: [],
      };
    }

    case 'DELETE_PROMPT': {
      const { tab, index } = action;
      if (tab === 'settings') return state;
      const list = [...(state.present[tab] as Prompt[])];
      list.splice(index, 1);

      return {
        past: [...state.past, state.present],
        present: { ...state.present, [tab]: list },
        future: [],
      };
    }

    case 'UPDATE_PROMPT': {
      const { tab, index, prompt } = action;
      if (tab === 'settings') return state;
      const list = [...(state.present[tab] as Prompt[])];
      list[index] = prompt;

      return {
        past: [...state.past, state.present],
        present: { ...state.present, [tab]: list },
        future: [],
      };
    }

    case 'INSERT_PROMPT': {
      const { tab, index, prompt } = action;
      if (tab === 'settings') return state;
      const list = [...(state.present[tab] as Prompt[])];
      list.splice(index, 0, prompt);

      return {
        past: [...state.past, state.present],
        present: { ...state.present, [tab]: list },
        future: [],
      };
    }

    case 'UPDATE_SETTINGS': {
      return {
        past: [...state.past, state.present],
        present: { ...state.present, settings: action.settings },
        future: [],
      };
    }

    case 'STAGE_PROMPT': {
      const { tab, index } = action;
      if (tab === 'settings') return state;
      const targetPrompt = state.present[tab]?.[index];
      if (!targetPrompt) return state;

      const isCanned = tab === 'canned';
      const isStaging = isCanned ? true : !targetPrompt.staged;
      const nextPresent: PromptStorageData = { ...state.present };
      
      // Clone lists we will modify
      const sourceTabs: (keyof Omit<PromptStorageData, 'settings'>)[] = ['main', 'canned', 'notes', 'snippets', 'archive'];
      sourceTabs.forEach(t => {
        nextPresent[t] = state.present[t] ? [...state.present[t]] : [];
      });

      if (isStaging) {
        // Move other staged prompts to archive
        const moveFromTabs: Tab[] = ['main', 'canned', 'notes', 'snippets'];
        moveFromTabs.forEach(t => {
          const list = nextPresent[t] as Prompt[];
          for (let i = list.length - 1; i >= 0; i--) {
            const p = list[i]!;
            if (p.staged && p.id !== targetPrompt.id) {
              list.splice(i, 1);
              nextPresent.archive.unshift({ ...p, staged: false });
            }
          }
        });
        // Also un-stage any in archive
        nextPresent.archive = nextPresent.archive.map(p => 
          (p.staged && p.id !== targetPrompt.id) ? { ...p, staged: false } : p
        );

        // Stage the target (unless it's canned)
        if (!isCanned) {
          const list = nextPresent[tab] as Prompt[];
          const targetIdx = list.findIndex(p => p.id === targetPrompt.id);
          if (targetIdx !== -1) {
            list[targetIdx] = { ...list[targetIdx]!, staged: true };
          }
        }
      } else {
        // Just un-stage
        const list = nextPresent[tab] as Prompt[];
        const targetIdx = list.findIndex(p => p.id === targetPrompt.id);
        if (targetIdx !== -1) {
          list[targetIdx] = { ...list[targetIdx]!, staged: false };
        }
      }

      return {
        past: [...state.past, state.present],
        present: nextPresent,
        future: [],
      };
    }

    default:
      return state;
  }
}
