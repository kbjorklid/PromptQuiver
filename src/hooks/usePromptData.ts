import { useState, useEffect, useCallback, useReducer } from 'react';
import type { Prompt, PromptStorageData } from '../storage';
import { loadPrompts as defaultLoadPrompts, savePrompts as defaultSavePrompts } from '../storage';
import { useAutoSave } from './useAutoSave';
import type { Tab, Settings } from './types';
import { promptReducer, INITIAL_PROMPT_STATE } from './usePromptReducer';

export interface UsePromptDataProps {
  cwd: string;
  loadPromptsFn?: typeof defaultLoadPrompts;
  savePromptsFn?: typeof defaultSavePrompts;
  debounceMs?: number;
  onSaveError: (err: any) => void;
}

export function usePromptData({
  cwd,
  loadPromptsFn = defaultLoadPrompts,
  savePromptsFn = defaultSavePrompts,
  debounceMs = 500,
  onSaveError,
}: UsePromptDataProps) {
  const [state, dispatch] = useReducer(promptReducer, INITIAL_PROMPT_STATE);
  const data = state.present;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const loaded = await loadPromptsFn(cwd);
      dispatch({ type: 'SET_DATA', payload: loaded });
      setIsLoading(false);
    }
    init();
  }, [cwd, loadPromptsFn]);

  // Handle auto-save
  const { triggerSave } = useAutoSave({
    cwd,
    data,
    isLoading,
    savePromptsFn,
    onSaveError,
    debounceMs,
  });

  const pushState = useCallback((nextData: PromptStorageData, immediateSave = false) => {
    dispatch({ type: 'PUSH_STATE', payload: nextData });
    if (immediateSave) {
      triggerSave(true, nextData);
    }
  }, [triggerSave]);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  // CRUD Operations
  const moveItemInList = useCallback((tab: Tab, fromIndex: number, toIndex: number) => {
    dispatch({ type: 'MOVE_ITEM_IN_LIST', tab, fromIndex, toIndex });
  }, []);

  const movePrompt = useCallback((from: Tab, to: Tab, index: number, targetTab?: Tab) => {
    dispatch({ type: 'MOVE_PROMPT', from, to, index, targetTab });
  }, []);

  const deletePrompt = useCallback((tab: Tab, index: number) => {
    dispatch({ type: 'DELETE_PROMPT', tab, index });
  }, []);

  const stagePrompt = useCallback((tab: Tab, index: number) => {
    dispatch({ type: 'STAGE_PROMPT', tab, index });
  }, []);

  const updatePromptInList = useCallback((tab: Tab, index: number, prompt: Prompt, immediateSave = false) => {
    dispatch({ type: 'UPDATE_PROMPT', tab, index, prompt });
    if (immediateSave) {
      if (tab === 'settings') return;
      // We need to pass the updated data to triggerSave immediately.
      // Since dispatch is asynchronous in terms of when 'data' (state.present) updates,
      // we calculate the next data here if we want an immediate save.
      const list = [...(data[tab] as Prompt[])];
      list[index] = prompt;
      const nextData = { ...data, [tab]: list };
      triggerSave(true, nextData);
    }
  }, [data, triggerSave]);

  const insertPromptInList = useCallback((tab: Tab, index: number, prompt: Prompt, immediateSave = false) => {
    dispatch({ type: 'INSERT_PROMPT', tab, index, prompt });
    if (immediateSave) {
      if (tab === 'settings') return;
      const list = [...(data[tab] as Prompt[])];
      list.splice(index, 0, prompt);
      const nextData = { ...data, [tab]: list };
      triggerSave(true, nextData);
    }
  }, [data, triggerSave]);

  const updateSettings = useCallback((settings: Settings, immediateSave = false) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings });
    if (immediateSave) {
      const nextData = { ...data, settings };
      triggerSave(true, nextData);
    }
  }, [data, triggerSave]);

  return {
    data,
    isLoading,
    pushState,
    undo,
    redo,
    triggerSave,
    moveItemInList,
    movePrompt,
    deletePrompt,
    stagePrompt,
    updatePromptInList,
    insertPromptInList,
    updateSettings,
  };
}

