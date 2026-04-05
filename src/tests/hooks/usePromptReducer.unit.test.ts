import { expect, test, describe } from 'bun:test';
import { promptReducer, INITIAL_PROMPT_STATE } from '../../hooks/usePromptReducer';
import type { PromptStorageData, Prompt } from '../../storage';

const createPrompt = (id: string, text: string, type: 'prompt' | 'note' = 'prompt'): Prompt => ({
  id,
  text,
  type,
  created_at: 'now',
  updated_at: 'now',
});

const defaultSettings = {
  tabVisibility: {
    main: true,
    notes: true,
    canned: true,
    snippets: true,
    archive: true,
    settings: true,
  },
  slashCommands: [],
};

const mockData: PromptStorageData = {
  main: [createPrompt('1', 'P1'), createPrompt('2', 'P2')],
  notes: [createPrompt('3', 'N1', 'note')],
  archive: [],
  canned: [],
  snippets: [],
  settings: defaultSettings,
};

describe('promptReducer', () => {
  test('SET_DATA resets history', () => {
    const state = {
      present: mockData,
      past: [INITIAL_PROMPT_STATE.present],
      future: [INITIAL_PROMPT_STATE.present],
    };
    const newState = promptReducer(state, { type: 'SET_DATA', payload: mockData });
    expect(newState.present).toEqual(mockData);
    expect(newState.past).toHaveLength(0);
    expect(newState.future).toHaveLength(0);
  });

  test('PUSH_STATE adds to past and clears future', () => {
    const state = INITIAL_PROMPT_STATE;
    const nextData = { ...mockData, main: [] };
    const newState = promptReducer(state, { type: 'PUSH_STATE', payload: nextData });
    expect(newState.present).toEqual(nextData);
    expect(newState.past).toHaveLength(1);
    expect(newState.past[0]!).toEqual(state.present);
    expect(newState.future).toHaveLength(0);
  });

  test('UNDO and REDO', () => {
    let state = INITIAL_PROMPT_STATE;
    state = promptReducer(state, { type: 'PUSH_STATE', payload: mockData });
    
    // Undo
    state = promptReducer(state, { type: 'UNDO' });
    expect(state.present).toEqual(INITIAL_PROMPT_STATE.present);
    expect(state.past).toHaveLength(0);
    expect(state.future).toHaveLength(1);
    expect(state.future[0]!).toEqual(mockData);
    
    // Redo
    state = promptReducer(state, { type: 'REDO' });
    expect(state.present).toEqual(mockData);
    expect(state.past).toHaveLength(1);
    expect(state.future).toHaveLength(0);
  });

  test('MOVE_ITEM_IN_LIST', () => {
    const state = { ...INITIAL_PROMPT_STATE, present: mockData };
    const newState = promptReducer(state, { 
      type: 'MOVE_ITEM_IN_LIST', 
      tab: 'main', 
      fromIndex: 0, 
      toIndex: 1 
    });
    expect(newState.present.main[0]!.id).toBe('2');
    expect(newState.present.main[1]!.id).toBe('1');
    expect(newState.past).toHaveLength(1);
  });

  test('MOVE_PROMPT', () => {
    const state = { ...INITIAL_PROMPT_STATE, present: mockData };
    const newState = promptReducer(state, { 
      type: 'MOVE_PROMPT', 
      from: 'main', 
      to: 'notes', 
      index: 0 
    });
    expect(newState.present.main).toHaveLength(1);
    expect(newState.present.notes).toHaveLength(2);
    expect(newState.present.notes[1]!.id).toBe('1');
  });

  test('MOVE_PROMPT from archive with targetTab', () => {
    const dataWithArchive = {
        ...mockData,
        archive: [createPrompt('4', 'A1')]
    };
    const state = { ...INITIAL_PROMPT_STATE, present: dataWithArchive };
    const newState = promptReducer(state, { 
      type: 'MOVE_PROMPT', 
      from: 'archive', 
      to: 'main', 
      index: 0,
      targetTab: 'main'
    });
    expect(newState.present.archive).toHaveLength(0);
    expect(newState.present.main).toHaveLength(3);
    expect(newState.present.main[2]!.id).toBe('4');
  });

  test('DELETE_PROMPT', () => {
    const state = { ...INITIAL_PROMPT_STATE, present: mockData };
    const newState = promptReducer(state, { 
      type: 'DELETE_PROMPT', 
      tab: 'main', 
      index: 0 
    });
    expect(newState.present.main).toHaveLength(1);
    expect(newState.present.main[0]!.id).toBe('2');
  });

  test('UPDATE_PROMPT', () => {
    const state = { ...INITIAL_PROMPT_STATE, present: mockData };
    const updatedPrompt = { ...mockData.main[0]!, text: 'Updated' };
    const newState = promptReducer(state, { 
      type: 'UPDATE_PROMPT', 
      tab: 'main', 
      index: 0, 
      prompt: updatedPrompt 
    });
    expect(newState.present.main[0]!.text).toBe('Updated');
  });

  test('INSERT_PROMPT', () => {
    const state = { ...INITIAL_PROMPT_STATE, present: mockData };
    const newPrompt = createPrompt('5', 'New');
    const newState = promptReducer(state, { 
      type: 'INSERT_PROMPT', 
      tab: 'main', 
      index: 1, 
      prompt: newPrompt 
    });
    expect(newState.present.main).toHaveLength(3);
    expect(newState.present.main[1]!.id).toBe('5');
  });

  test('MOVE_ITEM_IN_LIST to same index does nothing', () => {
    const state = { ...INITIAL_PROMPT_STATE, present: mockData };
    const newState = promptReducer(state, { 
      type: 'MOVE_ITEM_IN_LIST', 
      tab: 'main', 
      fromIndex: 0, 
      toIndex: 0 
    });
    expect(newState).toBe(state);
  });
});
