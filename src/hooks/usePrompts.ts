import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Prompt, PromptStorageData } from '../storage';
import { loadPrompts as defaultLoadPrompts, savePrompts as defaultSavePrompts } from '../storage';
import { v4 as uuidv4 } from 'uuid';
import { useAutoSave } from './useAutoSave';
import { getCurrentGitBranch } from '../utils/git';

export type Tab = 'main' | 'notes' | 'archive';
export type View = 'list' | 'editor';
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
  const [appState, setAppState] = useState<{
    data: PromptStorageData;
    history: PromptStorageData[];
    future: PromptStorageData[];
  }>({
    data: { main: [], notes: [], archive: [] },
    history: [],
    future: [],
  });
  const { data, history, future } = appState;

  const [activeTab, setActiveTab] = useState<Tab>('main');
  const [selectedIndices, setSelectedIndices] = useState<Record<Tab, number>>({ main: 0, notes: 0, archive: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [addingPosition, setAddingPosition] = useState<{position: 'before'|'after'|'start'|'end', index: number} | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastCopiedId, setLastCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [branchFilterEnabled, setBranchFilterEnabled] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<string | undefined>(undefined);

  const refreshCurrentBranch = useCallback(() => {
    const branch = getCurrentGitBranch(cwd);
    setCurrentBranch(branch);
    return branch;
  }, [cwd]);

  const toggleBranchFilter = useCallback(() => {
    setBranchFilterEnabled(prev => {
      const next = !prev;
      if (next) {
        refreshCurrentBranch();
      }
      return next;
    });
  }, [refreshCurrentBranch]);

  useEffect(() => {
    if (!branchFilterEnabled) return;
    refreshCurrentBranch();
    const interval = setInterval(refreshCurrentBranch, 10000);
    return () => clearInterval(interval);
  }, [branchFilterEnabled, refreshCurrentBranch]);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message });
    toastTimer.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  useEffect(() => {
    async function init() {
      const loaded = await loadPromptsFn(cwd);
      setAppState(prev => ({ ...prev, data: loaded }));
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
    onSaveError: (err) => {
      showToast('Error: Failed to save prompts!');
      console.error('Save error:', err);
    },
    debounceMs,
  });

  const currentList = useMemo(() => {
    let fullList = data[activeTab];
    if (branchFilterEnabled && currentBranch) {
      fullList = fullList.filter(p => !p.branch || p.branch === currentBranch);
    }
    return searchQuery 
      ? fullList.filter(p => p.text.toLowerCase().includes(searchQuery.toLowerCase()))
      : fullList;
  }, [data, activeTab, searchQuery, branchFilterEnabled, currentBranch]);

  const selectedIndex = useMemo(() => {
    return Math.min(
      selectedIndices[activeTab],
      Math.max(0, currentList.length - 1)
    );
  }, [selectedIndices, activeTab, currentList.length]);

  const updateSelectedIndex = useCallback((index: number) => {
    setSelectedIndices((prev) => ({
      ...prev,
      [activeTab]: index,
    }));
  }, [activeTab]);

  const pushState = useCallback((nextData: PromptStorageData, immediateSave = false) => {
    setAppState(current => ({
      history: [...current.history, current.data],
      future: [],
      data: nextData,
    }));
    if (immediateSave) {
      triggerSave(true, nextData);
    }
  }, [triggerSave]);

  const undo = useCallback(() => {
    setAppState(current => {
      if (current.history.length === 0) return current;
      const prev = current.history[current.history.length - 1];
      if (!prev) return current;
      return {
        history: current.history.slice(0, -1),
        future: [current.data, ...current.future],
        data: prev,
      };
    });
    showToast('Undo performed');
  }, [showToast]);

  const redo = useCallback(() => {
    setAppState(current => {
      if (current.future.length === 0) return current;
      const next = current.future[0];
      if (!next) return current;
      return {
        history: [...current.history, current.data],
        future: current.future.slice(1),
        data: next,
      };
    });
    showToast('Redo performed');
  }, [showToast]);

  const moveItemInList = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= currentList.length) return;
    if (searchQuery) return; // Disable moving while searching

    const listName = activeTab;
    const newList = [...data[listName]];
    const movedItem = newList.splice(fromIndex, 1)[0];
    if (!movedItem) return;
    
    newList.splice(toIndex, 0, movedItem);

    pushState({
      ...data,
      [listName]: newList,
    });
    updateSelectedIndex(toIndex);
  }, [data, currentList.length, searchQuery, activeTab, pushState, updateSelectedIndex]);

  const movePrompt = useCallback((from: Tab, to: Tab, index: number) => {
    const fromList = [...data[from]];
    const toList = [...data[to]];
    const [prompt] = fromList.splice(index, 1);
    
    if (prompt) {
      if (from === 'archive') {
        const targetTab: Tab = prompt.type === 'note' ? 'notes' : 'main';
        const targetList = [...data[targetTab]];
        targetList.push(prompt);
        pushState({
          ...data,
          archive: fromList,
          [targetTab]: targetList,
        });
        const toName = targetTab === 'main' ? 'Prompt' : 'Notes';
        showToast(`Restored to ${toName}`);
      } else {
        toList.push(prompt);
        pushState({
          ...data,
          [from]: fromList,
          [to]: toList,
        });
        const toName = to === 'main' ? 'Prompt' : to.charAt(0).toUpperCase() + to.slice(1);
        showToast(`Moved to ${toName}`);
      }
    }
  }, [data, pushState, showToast]);

  const deletePrompt = useCallback((tab: Tab, index: number) => {
    const list = [...data[tab]];
    list.splice(index, 1);
    pushState({
      ...data,
      [tab]: list,
    });
    showToast("Deleted. Press 'u' to undo (5s)");
  }, [data, pushState, showToast]);

  const addPrompt = useCallback((position: 'before' | 'after' | 'start' | 'end') => {
    const now = new Date().toISOString();
    const branch = refreshCurrentBranch();
    const type: 'prompt' | 'note' = activeTab === 'notes' ? 'note' : 'prompt';
    const newPrompt: Prompt = {
      id: uuidv4(),
      text: '',
      type,
      branch,
      created_at: now,
      updated_at: now,
    };

    setAddingPosition({ position, index: selectedIndex });
    setEditingPrompt(newPrompt);
    setView('editor');
  }, [activeTab, selectedIndex, refreshCurrentBranch]);

  const saveEditedPrompt = useCallback((text: string) => {
    if (!editingPrompt) return;
    
    const listName = activeTab;
    const list = [...data[listName]];
    
    if (addingPosition) {
      const newPrompt = {
        ...editingPrompt,
        text: text,
        updated_at: new Date().toISOString(),
      };
      let newIndex = 0;
      if (addingPosition.position === 'start') {
        list.unshift(newPrompt);
        newIndex = 0;
      } else if (addingPosition.position === 'end') {
        list.push(newPrompt);
        newIndex = list.length - 1;
      } else if (addingPosition.position === 'before') {
        list.splice(addingPosition.index, 0, newPrompt);
        newIndex = addingPosition.index;
      } else if (addingPosition.position === 'after') {
        if (list.length === 0) {
          list.push(newPrompt);
          newIndex = 0;
        } else {
          list.splice(addingPosition.index + 1, 0, newPrompt);
          newIndex = addingPosition.index + 1;
        }
      }
      const nextData = { ...data, [listName]: list };
      pushState(nextData, true);
      updateSelectedIndex(newIndex);
      showToast('Added');
    } else {
      const index = list.findIndex((p) => p.id === editingPrompt.id);
      if (index !== -1) {
        const nextData = { ...data };
        nextData[listName] = [...list];
        nextData[listName][index] = {
          ...editingPrompt,
          text: text,
          updated_at: new Date().toISOString(),
        };
        pushState(nextData, true);
        showToast('Saved');
      }
    }
    setAddingPosition(null);
    setView('list');
    setEditingPrompt(null);
  }, [editingPrompt, activeTab, data, addingPosition, pushState, updateSelectedIndex, showToast]);

  const cancelEdit = useCallback(() => {
    setAddingPosition(null);
    setView('list');
    setEditingPrompt(null);
  }, []);

  const openEditor = useCallback((prompt: Prompt) => {
    setEditingPrompt(prompt);
    setView('editor');
  }, []);

  const processNextPrompt = useCallback(() => {
    if (activeTab === 'main' && data.main.length > 0) {
      const fromList = [...data.main];
      const toList = [...data.archive];
      const [prompt] = fromList.splice(0, 1);
      if (prompt) {
        toList.push(prompt);
        pushState({
          ...data,
          main: fromList,
          archive: toList,
        });
        return prompt;
      }
    }
    return null;
  }, [activeTab, data, pushState]);

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
    pushState,
    branchFilterEnabled,
    toggleBranchFilter,
    currentBranch,
  };
}
