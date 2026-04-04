import { useState, useEffect, useCallback } from 'react';
import type { Prompt, PromptStorageData } from '../storage';
import { loadPrompts as defaultLoadPrompts, savePrompts as defaultSavePrompts } from '../storage';
import { useAutoSave } from './useAutoSave';
import { useUndoRedo } from './useUndoRedo';
import { Tab } from './types';

export interface UsePromptDataProps {
  cwd: string;
  loadPromptsFn?: typeof defaultLoadPrompts;
  savePromptsFn?: typeof defaultSavePrompts;
  debounceMs?: number;
  onSaveError: (err: any) => void;
}

const INITIAL_DATA: PromptStorageData = { 
  main: [], 
  notes: [], 
  archive: [], 
  canned: [], 
  snippets: [] 
};

export function usePromptData({
  cwd,
  loadPromptsFn = defaultLoadPrompts,
  savePromptsFn = defaultSavePrompts,
  debounceMs = 500,
  onSaveError,
}: UsePromptDataProps) {
  const { state: data, setState: pushState, undo, redo, reset } = useUndoRedo<PromptStorageData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const loaded = await loadPromptsFn(cwd);
      reset(loaded);
      setIsLoading(false);
    }
    init();
  }, [cwd, loadPromptsFn, reset]);

  // Handle auto-save
  const { triggerSave } = useAutoSave({
    cwd,
    data,
    isLoading,
    savePromptsFn,
    onSaveError,
    debounceMs,
  });

  const pushStateWithSave = useCallback((nextData: PromptStorageData, immediateSave = false) => {
    pushState(nextData);
    if (immediateSave) {
      triggerSave(true, nextData);
    }
  }, [pushState, triggerSave]);

  // CRUD Operations
  const moveItemInList = useCallback((tab: Tab, fromIndex: number, toIndex: number) => {
    const list = [...data[tab]];
    const movedItem = list.splice(fromIndex, 1)[0];
    if (!movedItem) return;
    list.splice(toIndex, 0, movedItem);

    pushStateWithSave({
      ...data,
      [tab]: list,
    });
  }, [data, pushStateWithSave]);

  const movePrompt = useCallback((from: Tab, to: Tab, index: number, targetTab?: Tab) => {
    const fromList = [...data[from]];
    const toList = [...data[to]];
    const [prompt] = fromList.splice(index, 1);
    
    if (prompt) {
      if (from === 'archive' && targetTab) {
        const actualTargetList = [...data[targetTab]];
        actualTargetList.push(prompt);
        pushStateWithSave({
          ...data,
          archive: fromList,
          [targetTab]: actualTargetList,
        });
      } else {
        toList.push(prompt);
        pushStateWithSave({
          ...data,
          [from]: fromList,
          [to]: toList,
        });
      }
    }
  }, [data, pushStateWithSave]);

  const deletePrompt = useCallback((tab: Tab, index: number) => {
    const list = [...data[tab]];
    list.splice(index, 1);
    pushStateWithSave({
      ...data,
      [tab]: list,
    });
  }, [data, pushStateWithSave]);

  const updatePromptInList = useCallback((tab: Tab, index: number, prompt: Prompt, immediateSave = false) => {
    const list = [...data[tab]];
    list[index] = prompt;
    pushStateWithSave({
      ...data,
      [tab]: list,
    }, immediateSave);
  }, [data, pushStateWithSave]);

  const insertPromptInList = useCallback((tab: Tab, index: number, prompt: Prompt, immediateSave = false) => {
    const list = [...data[tab]];
    list.splice(index, 0, prompt);
    pushStateWithSave({
      ...data,
      [tab]: list,
    }, immediateSave);
  }, [data, pushStateWithSave]);

  return {
    data,
    isLoading,
    pushState: pushStateWithSave,
    undo,
    redo,
    triggerSave,
    moveItemInList,
    movePrompt,
    deletePrompt,
    updatePromptInList,
    insertPromptInList,
  };
}
