import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Prompt, PromptStorageData, GlobalSearchResult } from '../storage';
import { searchGlobalPrompts } from '../storage';
import type { Tab, View } from './types';

export function usePromptUI(data: PromptStorageData, branchFilterEnabled: boolean, currentBranch: string | undefined) {
  const [activeTab, setActiveTab] = useState<Tab>('main');
  const [selectedIndices, setSelectedIndices] = useState<Record<Tab, number>>({ main: 0, notes: 0, archive: 0, canned: 0, snippets: 0, settings: 0 });
  const [view, setView] = useState<View>('list');
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [addingPosition, setAddingPosition] = useState<{position: 'before'|'after'|'start'|'end', index: number} | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastCopiedId, setLastCopiedId] = useState<string | null>(null);

  // Global Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchType, setGlobalSearchType] = useState<'prompt' | 'note'>('prompt');
  const [globalSearchResults, setGlobalSearchResults] = useState<GlobalSearchResult[]>([]);
  const [isGlobalSearchLoading, setIsGlobalSearchLoading] = useState(false);
  const [selectedIndexGlobal, setSelectedIndexGlobal] = useState(0);

  useEffect(() => {
    if (view !== 'globalSearch') return;

    const controller = new AbortController();
    const fetchResults = async () => {
      setIsGlobalSearchLoading(true);
      try {
        const results = await searchGlobalPrompts(globalSearchQuery, globalSearchType);
        if (!controller.signal.aborted) {
          setGlobalSearchResults(results);
          setSelectedIndexGlobal(0);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setGlobalSearchResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsGlobalSearchLoading(false);
        }
      }
    };

    const timeout = setTimeout(fetchResults, 300);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [globalSearchQuery, globalSearchType, view]);

  const currentList = useMemo(() => {
    if (view === 'globalSearch') return globalSearchResults;
    if (activeTab === 'settings') return [];
    let fullList = data[activeTab] as Prompt[] || [];
    if (branchFilterEnabled && currentBranch && activeTab !== 'canned' && activeTab !== 'snippets') {
      fullList = fullList.filter(p => !p.branch || p.branch === currentBranch);
    }
    return searchQuery 
      ? fullList.filter(p => p.text.toLowerCase().includes(searchQuery.toLowerCase()))
      : fullList;
  }, [data, activeTab, searchQuery, branchFilterEnabled, currentBranch, view, globalSearchResults]);

  const selectedIndex = useMemo(() => {
    if (view === 'globalSearch') {
      return Math.min(selectedIndexGlobal, Math.max(0, globalSearchResults.length - 1));
    }
    return Math.min(
      selectedIndices[activeTab],
      Math.max(0, currentList.length - 1)
    );
  }, [selectedIndices, activeTab, currentList.length, view, selectedIndexGlobal, globalSearchResults.length]);

  const updateSelectedIndex = useCallback((index: number) => {
    if (view === 'globalSearch') {
      setSelectedIndexGlobal(index);
    } else {
      setSelectedIndices((prev) => ({
        ...prev,
        [activeTab]: index,
      }));
    }
  }, [activeTab, view]);

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
    globalSearchQuery,
    setGlobalSearchQuery,
    globalSearchType,
    setGlobalSearchType,
    globalSearchResults,
    isGlobalSearchLoading,
  };
}

