import { useState, useCallback, useRef, useMemo } from 'react';
import type { Prompt, PromptStorageData } from '../storage';
import { Tab, View } from './types';

export function usePromptUI(data: PromptStorageData, branchFilterEnabled: boolean, currentBranch: string | undefined) {
  const [activeTab, setActiveTab] = useState<Tab>('main');
  const [selectedIndices, setSelectedIndices] = useState<Record<Tab, number>>({ main: 0, notes: 0, archive: 0, canned: 0, snippets: 0 });
  const [view, setView] = useState<View>('list');
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [addingPosition, setAddingPosition] = useState<{position: 'before'|'after'|'start'|'end', index: number} | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastCopiedId, setLastCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message });
    toastTimer.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  const currentList = useMemo(() => {
    let fullList = data[activeTab] || [];
    if (branchFilterEnabled && currentBranch && activeTab !== 'canned') {
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

  return {
    activeTab,
    setActiveTab,
    currentList,
    selectedIndex,
    updateSelectedIndex,
    view,
    setView,
    editingPrompt,
    setEditingPrompt,
    addingPosition,
    setAddingPosition,
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
  };
}
