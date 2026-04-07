import { useCallback, useState } from 'react';
import type { Prompt } from '../storage';
import { loadPrompts as defaultLoadPrompts, savePrompts as defaultSavePrompts } from '../storage';
import { v4 as uuidv4 } from 'uuid';
import { useBranchFilter } from './useBranchFilter';
import { usePromptUI } from './usePromptUI';
import { usePromptData } from './usePromptData';
import { useAppFeedback } from './useAppFeedback';
import type { Tab, View, Toast } from './types';

export type { Tab, View, Toast };

export interface UsePromptsProps {
  cwd: string;
  loadPromptsFn?: typeof defaultLoadPrompts;
  savePromptsFn?: typeof defaultSavePrompts;
  debounceMs?: number;
  pollInterval?: number;
}

export function usePrompts({
  cwd,
  loadPromptsFn = defaultLoadPrompts,
  savePromptsFn = defaultSavePrompts,
  debounceMs = 500,
  pollInterval = 10000,
}: UsePromptsProps) {
  const { branchFilterEnabled, currentBranch, toggleBranchFilter, refreshCurrentBranch } = useBranchFilter(cwd, pollInterval);
  
  const onSaveError = useCallback((err: any) => {
    console.error('Save error:', err);
  }, []);

  const { 
    data, isLoading, pushState, undo, redo, 
    moveItemInList: dataMoveItemInList,
    movePrompt: dataMovePrompt,
    deletePrompt: dataDeletePrompt,
    stagePrompt: dataStagePrompt,
    updatePromptInList,
    insertPromptInList,
    updateSettings,
  } = usePromptData({
    cwd,
    loadPromptsFn,
    savePromptsFn,
    debounceMs,
    onSaveError,
  });

  const { toast, showToast, copyToClipboard, getFromClipboard } = useAppFeedback();

  const {
    activeTab, setActiveTab, currentList, selectedIndex, updateSelectedIndex,
    view, setView, editingPrompt, setEditingPrompt, addingPosition, setAddingPosition,
    isSearching, setIsSearching, searchQuery, setSearchQuery,
    isMoving, setIsMoving, lastCopiedId, setLastCopiedId,
    globalSearchQuery, setGlobalSearchQuery,
    globalSearchType, setGlobalSearchType,
    globalSearchResults, isGlobalSearchLoading,
  } = usePromptUI(data, branchFilterEnabled, currentBranch);

  const [previousView, setPreviousView] = useState<View>('list');

  const openGlobalSearch = useCallback(() => {
    setPreviousView(view);
    setView('globalSearch');
  }, [view, setView]);

  const cancelGlobalSearch = useCallback(() => {
    setView('list');
  }, [setView]);

  const pastePrompt = useCallback(() => {
    if (activeTab === 'archive' || activeTab === 'settings' || activeTab === 'canned' || activeTab === 'snippets') return;
    
    const text = getFromClipboard();
    if (!text) return;

    const now = new Date().toISOString();
    const branch = refreshCurrentBranch();
    const type: 'prompt' | 'note' = activeTab === 'notes' ? 'note' : 'prompt';
    const newPrompt: Prompt = {
      id: uuidv4(),
      text,
      type,
      branch,
      created_at: now,
      updated_at: now,
    };

    const index = currentList.length === 0 ? 0 : selectedIndex + 1;
    insertPromptInList(activeTab, index, newPrompt, true);
    updateSelectedIndex(index);
    showToast(`Pasted to ${activeTab === 'notes' ? 'Notes' : 'Prompts'}`);
  }, [activeTab, getFromClipboard, refreshCurrentBranch, currentList.length, selectedIndex, insertPromptInList, updateSelectedIndex, showToast]);

  const moveItemInList = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= currentList.length) return;
    if (searchQuery) return;

    dataMoveItemInList(activeTab, fromIndex, toIndex);
    updateSelectedIndex(toIndex);
  }, [activeTab, currentList.length, dataMoveItemInList, searchQuery, updateSelectedIndex]);

  const movePrompt = useCallback((from: Tab, to: Tab, index: number) => {
    let targetTab: Tab | undefined;
    if (from === 'archive') {
      const fromList = data[from];
      const prompt = fromList[index];
      if (prompt) {
        targetTab = prompt.type === 'note' ? 'notes' : 'main';
      }
    }

    dataMovePrompt(from, to, index, targetTab);
    
    if (from === 'archive' && targetTab) {
      const toName = targetTab === 'main' ? 'Prompt' : 'Notes';
      showToast(`Restored to ${toName}`);
    } else {
      const toName = to === 'main' ? 'Prompt' : to.charAt(0).toUpperCase() + to.slice(1);
      showToast(`Moved to ${toName}`);
    }
  }, [data, dataMovePrompt, showToast]);

  const deletePrompt = useCallback((tab: Tab, index: number) => {
    dataDeletePrompt(tab, index);
    showToast("Deleted. Press 'u' to undo (5s)");
  }, [dataDeletePrompt, showToast]);

  const addPrompt = useCallback((position: 'before' | 'after' | 'start' | 'end') => {
    const now = new Date().toISOString();
    const branch = (activeTab === 'canned' || activeTab === 'snippets') ? undefined : refreshCurrentBranch();
    const type: 'prompt' | 'note' = activeTab === 'notes' ? 'note' : 'prompt';
    const newPrompt: Prompt = {
      id: uuidv4(),
      text: '',
      type,
      branch,
      created_at: now,
      updated_at: now,
      name: activeTab === 'snippets' ? '' : undefined,
    };

    setAddingPosition({ position, index: selectedIndex });
    setEditingPrompt(newPrompt);
    setView('editor');
  }, [activeTab, selectedIndex, refreshCurrentBranch, setAddingPosition, setEditingPrompt, setView]);

  const saveEditedPrompt = useCallback((text: string, name?: string, shouldStage?: boolean) => {
    if (!editingPrompt) return;
    if (activeTab === 'settings') return; // Should not happen

    if (previousView === 'globalSearch') {
      const targetTab = editingPrompt.type === 'note' ? 'notes' : 'main';
      const now = new Date().toISOString();
      const newPrompt: Prompt = {
        ...editingPrompt,
        id: uuidv4(),
        text,
        name,
        created_at: now,
        updated_at: now,
        staged: shouldStage || false,
      };
      
      insertPromptInList(targetTab, 0, newPrompt, true);
      setActiveTab(targetTab);
      updateSelectedIndex(0);
      showToast(`Copied to ${targetTab === 'main' ? 'Prompts' : 'Notes'}${shouldStage ? ' and Staged' : ''}`);
      
      setAddingPosition(null);
      setView('list');
      setEditingPrompt(null);
      setPreviousView('list');
      return;
    }
    
    const listName = activeTab;
    const list = data[listName] as Prompt[];
    let finalIndex = -1;
    
    if (addingPosition) {
      const newPrompt = {
        ...editingPrompt,
        text: text,
        name: name,
        updated_at: new Date().toISOString(),
      };
      if (addingPosition.position === 'start') {
        finalIndex = 0;
        insertPromptInList(listName, 0, newPrompt, true);
      } else if (addingPosition.position === 'end') {
        finalIndex = list.length;
        insertPromptInList(listName, list.length, newPrompt, true);
      } else if (addingPosition.position === 'before') {
        finalIndex = addingPosition.index;
        insertPromptInList(listName, addingPosition.index, newPrompt, true);
      } else if (addingPosition.position === 'after') {
        finalIndex = list.length === 0 ? 0 : addingPosition.index + 1;
        insertPromptInList(listName, finalIndex, newPrompt, true);
      }
      updateSelectedIndex(finalIndex);
      showToast(shouldStage ? 'Added and Staged' : 'Added');
    } else {
      const index = list.findIndex((p) => p.id === editingPrompt.id);
      if (index !== -1) {
        finalIndex = index;
        const updatedPrompt = {
          ...editingPrompt,
          text: text,
          name: name,
          updated_at: new Date().toISOString(),
        };
        updatePromptInList(listName, index, updatedPrompt, true);
        showToast(shouldStage ? 'Saved and Staged' : 'Saved');
      }
    }

    if (shouldStage && finalIndex !== -1) {
      // If already staged, STAGE_PROMPT would toggle it off.
      // So we only call it if it's NOT already staged.
      // For NEW prompts, editingPrompt.staged is undefined/false.
      if (!editingPrompt.staged) {
        dataStagePrompt(listName, finalIndex);
      }
    }

    setAddingPosition(null);
    setView('list');
    setEditingPrompt(null);
  }, [editingPrompt, activeTab, previousView, data, addingPosition, updateSelectedIndex, showToast, setAddingPosition, setView, setEditingPrompt, insertPromptInList, updatePromptInList, dataStagePrompt, setActiveTab]);

  const cancelEdit = useCallback(() => {
    setAddingPosition(null);
    setView(previousView === 'globalSearch' ? 'globalSearch' : 'list');
    setEditingPrompt(null);
    if (previousView === 'globalSearch') setPreviousView('list');
  }, [setAddingPosition, setView, setEditingPrompt, previousView]);

  const openEditor = useCallback((prompt: Prompt) => {
    setPreviousView(view);
    setEditingPrompt(prompt);
    setView('editor');
  }, [setEditingPrompt, setView, view]);

  const stagePrompt = useCallback(() => {
    const prompt = currentList[selectedIndex];
    if (prompt) {
      dataStagePrompt(activeTab, selectedIndex);
      return prompt;
    }
    return null;
  }, [activeTab, currentList, dataStagePrompt, selectedIndex]);

  return {
    data,
    isLoading,
    activeTab,
    setActiveTab,
    currentList,
    selectedIndex,
    updateSelectedIndex,
    view,
    setView,
    editingPrompt,
    setEditingPrompt,
    isSearching,
    setIsSearching,
    searchQuery,
    setSearchQuery,
    isMoving,
    setIsMoving,
    lastCopiedId,
    setLastCopiedId,
    toast,
    showToast,
    copyToClipboard,
    undo,
    redo,
    moveItemInList,
    movePrompt,
    deletePrompt,
    addPrompt,
    saveEditedPrompt,
    cancelEdit,
    openEditor,
    stagePrompt,
    updateSettings,
    pushState,
    branchFilterEnabled,
    toggleBranchFilter,
    currentBranch,
    globalSearchQuery,
    setGlobalSearchQuery,
    globalSearchType,
    setGlobalSearchType,
    globalSearchResults,
    isGlobalSearchLoading,
    openGlobalSearch,
    cancelGlobalSearch,
    pastePrompt,
  };
}

