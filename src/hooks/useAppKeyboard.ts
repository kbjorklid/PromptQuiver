import { useInput, useApp } from 'ink';
import type { Tab, View } from './types';

interface AppKeyboardProps {
  view: 'list' | 'editor' | 'globalSearch';
  activeTab: Tab;
  orderedTabs: Tab[];
  setActiveTab: (tab: Tab) => void;
  isSearching: boolean;
  setIsSearching: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  isMoving: boolean;
  setIsMoving: (val: boolean) => void;
  isModalOpen?: boolean;
  selectedIndex: number;
  updateSelectedIndex: (index: number) => void;
  itemCount: number;
  handleNextTab: () => void;
  handlePrevTab: () => void;
  handleEdit: () => void;
  handleArchive: () => void;
  handleRestore: () => void;
  handleStartMove: () => void;
  handleEndMove: () => void;
  handleStage: () => void;
  handleCopy: () => void;
  handlePaste: () => void;
  addPrompt: (position: 'before' | 'after' | 'start' | 'end') => void;
  toggleBranchFilter: () => void;
  undo: () => void;
  redo: () => void;
  moveItemInList: (from: number, to: number) => void;
  openGlobalSearch: () => void;
}

export const useAppKeyboard = ({
  view,
  activeTab,
  orderedTabs,
  setActiveTab,
  isSearching,
  setIsSearching,
  searchQuery,
  setSearchQuery,
  isMoving,
  isModalOpen,
  selectedIndex,
  updateSelectedIndex,
  itemCount,
  handleNextTab,
  handlePrevTab,
  handleEdit,
  handleArchive,
  handleRestore,
  handleStartMove,
  handleEndMove,
  handleStage,
  handleCopy,
  handlePaste,
  addPrompt,
  toggleBranchFilter,

  undo,
  redo,
  moveItemInList,
  openGlobalSearch,
}: AppKeyboardProps) => {
  const { exit } = useApp();

  useInput((input, key) => {
    if (view === 'editor' || view === 'globalSearch' || isModalOpen) return;

    // 1. Priority Modes (Searching, Moving)
    if (isSearching) {
      if (key.escape) {
        setIsSearching(false);
        setSearchQuery('');
      } else if (key.return) {
        setIsSearching(false);
      }
      return;
    }

    if (isMoving) {
      if (key.escape || key.return || input === 'm') {
        handleEndMove();
      } else if (key.upArrow || input === 'k') {
        moveItemInList(selectedIndex, selectedIndex - 1);
      } else if (key.downArrow || input === 'j') {
        moveItemInList(selectedIndex, selectedIndex + 1);
      }
      return;
    }

    // 2. Global Shortcuts (Tab switching, Settings, Exit)
    if (/^[1-9]$/.test(input)) {
      const tabIndex = parseInt(input) - 1;
      const nextTab = orderedTabs[tabIndex];
      if (nextTab) {
        setActiveTab(nextTab);
      }
      return;
    }

    if (key.tab) {
      return key.shift ? handlePrevTab() : handleNextTab();
    }

    if (input === 'q') return exit();
    if (input === 'G') return openGlobalSearch();
    if (input === 'S' || (key.ctrl && input === 's')) return setActiveTab('settings');
    if (key.ctrl && input === 'y') return redo();
    if (input === 'u') return undo();


    // 3. Settings Mode navigation
    if (activeTab === 'settings') {
      if (key.rightArrow || input === 'l') return handleNextTab();
      if (key.leftArrow || input === 'h') return handlePrevTab();
      return;
    }

    // 4. List Navigation
    const navMap: Record<string, () => void> = {
      'upArrow': () => updateSelectedIndex(Math.max(0, selectedIndex - 1)),
      'downArrow': () => updateSelectedIndex(Math.min(itemCount - 1, selectedIndex + 1)),
      'leftArrow': handlePrevTab,
      'rightArrow': handleNextTab,
      'k': () => updateSelectedIndex(Math.max(0, selectedIndex - 1)),
      'j': () => updateSelectedIndex(Math.min(itemCount - 1, selectedIndex + 1)),
      'h': handlePrevTab,
      'l': handleNextTab,
    };

    for (const [keyName, action] of Object.entries(navMap)) {
      if ((key as any)[keyName]) {
        action();
        return;
      }
    }
    
    // Character-based list navigation/actions
    if (navMap[input]) {
      navMap[input]();
      return;
    }

    // 5. General Actions
    if (key.return) return handleEdit();
    if (key.escape && searchQuery) return setSearchQuery('');

    if (key.ctrl && input === 'v') return handlePaste();

    const actionMap: Record<string, () => void> = {
      'e': handleEdit,
      '/': () => setIsSearching(true),
      'm': handleStartMove,
      'd': handleArchive,
      'r': handleRestore,
      's': handleStage,
      'y': handleCopy,
      'p': handlePaste,
      'a': () => activeTab !== 'archive' && addPrompt('after'),
      'A': () => activeTab !== 'archive' && addPrompt('end'),
      'i': () => activeTab !== 'archive' && addPrompt('before'),
      'I': () => activeTab !== 'archive' && addPrompt('start'),
      'b': toggleBranchFilter,
    };

    if (actionMap[input]) {
      actionMap[input]();
    }
  });
};
