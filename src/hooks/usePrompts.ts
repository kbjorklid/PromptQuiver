import { useCallback } from 'react';
import type { Prompt } from '../storage';
import { loadPrompts as defaultLoadPrompts, savePrompts as defaultSavePrompts } from '../storage';
import { v4 as uuidv4 } from 'uuid';
import { useBranchFilter } from './useBranchFilter';
import { usePromptUI } from './usePromptUI';
import { usePromptData } from './usePromptData';
import { Tab, View } from './types';

export type { Tab, View };
export interface Toast { message: string }

export interface UsePromptsProps {
  cwd: string;
  loadPromptsFn?: typeof defaultLoadPrompts;
  savePromptsFn?: typeof defaultSavePrompts;
  debounceMs?: number;
}

export function usePrompts({
  cwd,
  loadPromptsFn = defaultLoadPrompts,
  savePromptsFn = defaultSavePrompts,
  debounceMs = 500,
}: UsePromptsProps) {
  const { branchFilterEnabled, currentBranch, toggleBranchFilter, refreshCurrentBranch } = useBranchFilter(cwd);
  
  const onSaveError = useCallback((err: any) => {
    console.error('Save error:', err);
  }, []);

  const { 
    data, isLoading, pushState, undo, redo, 
    moveItemInList: dataMoveItemInList,
    movePrompt: dataMovePrompt,
    deletePrompt: dataDeletePrompt,
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

  const {
    activeTab, setActiveTab, currentList, selectedIndex, updateSelectedIndex,
    view, setView, editingPrompt, setEditingPrompt, addingPosition, setAddingPosition,
    isSearching, setIsSearching, searchQuery, setSearchQuery,
    isMoving, setIsMoving, lastCopiedId, setLastCopiedId,
    toast, showToast
  } = usePromptUI(data, branchFilterEnabled, currentBranch);

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

  const saveEditedPrompt = useCallback((text: string, name?: string) => {
    if (!editingPrompt) return;
    
    const listName = activeTab;
    const list = data[listName];
    
    if (addingPosition) {
      const newPrompt = {
        ...editingPrompt,
        text: text,
        name: name,
        updated_at: new Date().toISOString(),
      };
      let newIndex = 0;
      if (addingPosition.position === 'start') {
        newIndex = 0;
        insertPromptInList(listName, 0, newPrompt, true);
      } else if (addingPosition.position === 'end') {
        newIndex = list.length;
        insertPromptInList(listName, list.length, newPrompt, true);
      } else if (addingPosition.position === 'before') {
        newIndex = addingPosition.index;
        insertPromptInList(listName, addingPosition.index, newPrompt, true);
      } else if (addingPosition.position === 'after') {
        newIndex = list.length === 0 ? 0 : addingPosition.index + 1;
        insertPromptInList(listName, newIndex, newPrompt, true);
      }
      updateSelectedIndex(newIndex);
      showToast('Added');
    } else {
      const index = list.findIndex((p) => p.id === editingPrompt.id);
      if (index !== -1) {
        const updatedPrompt = {
          ...editingPrompt,
          text: text,
          name: name,
          updated_at: new Date().toISOString(),
        };
        updatePromptInList(listName, index, updatedPrompt, true);
        showToast('Saved');
      }
    }
    setAddingPosition(null);
    setView('list');
    setEditingPrompt(null);
  }, [editingPrompt, activeTab, data, addingPosition, updateSelectedIndex, showToast, setAddingPosition, setView, setEditingPrompt, insertPromptInList, updatePromptInList]);

  const cancelEdit = useCallback(() => {
    setAddingPosition(null);
    setView('list');
    setEditingPrompt(null);
  }, [setAddingPosition, setView, setEditingPrompt]);

  const openEditor = useCallback((prompt: Prompt) => {
    setEditingPrompt(prompt);
    setView('editor');
  }, [setEditingPrompt, setView]);

  const processNextPrompt = useCallback(() => {
    if (activeTab === 'main' && data.main.length > 0) {
      const prompt = data.main[0];
      dataMovePrompt('main', 'archive', 0);
      return prompt;
    }
    return null;
  }, [activeTab, data, dataMovePrompt]);

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
    undo,
    redo,
    moveItemInList,
    movePrompt,
    deletePrompt,
    addPrompt,
    saveEditedPrompt,
    cancelEdit,
    openEditor,
    processNextPrompt,
    updateSettings,
    pushState,
    branchFilterEnabled,
    toggleBranchFilter,
    currentBranch,
  };
}
