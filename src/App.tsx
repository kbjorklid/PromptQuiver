import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import Spinner from 'ink-spinner';
import { EditorView } from './components/EditorView';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchInput } from './components/SearchInput';
import { PromptList } from './components/PromptList';
import { loadPrompts, savePrompts } from './storage';
import clipboardy from 'clipboardy';
import { usePrompts } from './hooks/usePrompts';
import type { Tab } from './hooks/usePrompts';

const useTerminalSize = () => {
  const [size, setSize] = useState({
    columns: process.stdout.columns,
    rows: process.stdout.rows,
  });

  useEffect(() => {
    const handler = () => {
      setSize({
        columns: process.stdout.columns,
        rows: process.stdout.rows,
      });
    };
    process.stdout.on('resize', handler);
    return () => {
      process.stdout.off('resize', handler);
    };
  }, []);

  return size;
};

export const App = ({ 
  cwd, 
  loadPromptsFn = loadPrompts,
  savePromptsFn = savePrompts,
  viewportSize: initialViewportSize,
  debounceMs
}: { 
  cwd: string;
  loadPromptsFn?: typeof loadPrompts;
  savePromptsFn?: typeof savePrompts;
  viewportSize?: number;
  debounceMs?: number;
}) => {
  const { exit } = useApp();
  const terminalSize = useTerminalSize();
  
  const {
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
  } = usePrompts({ cwd, loadPromptsFn, savePromptsFn, debounceMs });

  const orderedTabs: Tab[] = ['main', 'notes', 'archive'];

  const switchTab = (direction: 'next' | 'prev') => {
    const currentIndex = orderedTabs.indexOf(activeTab);
    const offset = direction === 'next' ? 1 : -1;
    const nextIndex = (currentIndex + offset + orderedTabs.length) % orderedTabs.length;
    const nextTab = orderedTabs[nextIndex];
    if (nextTab) {
      setActiveTab(nextTab);
    }
  };

  const handleNextTab = () => switchTab('next');
  const handlePrevTab = () => switchTab('prev');

  const handleCopy = () => {
    if (activeTab === 'notes') return;
    const prompt = currentList[selectedIndex];
    if (prompt) {
      try {
        clipboardy.writeSync(prompt.text);
        setLastCopiedId(prompt.id);
        showToast('Copied to clipboard');
      } catch (e) {
        showToast('Failed to copy to clipboard');
      }
    }
  };

  const handleProcessNext = () => {
    if (activeTab !== 'main') return;
    const prompt = processNextPrompt();
    if (prompt) {
      try {
        clipboardy.writeSync(prompt.text);
        setLastCopiedId(prompt.id);
        showToast('Processed prompt and copied to clipboard');
      } catch (e) {
        showToast('Processed prompt (clipboard error)');
      }
    }
  };

  const handleEdit = () => {
    const prompt = currentList[selectedIndex];
    if (prompt) {
      openEditor(prompt);
    }
  };

  const handleArchiveRestore = () => {
    if (currentList.length === 0) return;
    if (activeTab === 'archive') {
      movePrompt('archive', 'main', selectedIndex);
    } else {
      movePrompt(activeTab, 'archive', selectedIndex);
    }
  };

  const handleDeleteArchive = () => {
    if (activeTab === 'archive' && currentList.length > 0) {
      deletePrompt('archive', selectedIndex);
    }
  };

  const handleStartMove = () => {
    if (view === 'list' && activeTab !== 'archive' && currentList.length > 0) {
      setIsMoving(true);
      showToast('Move mode: use ↑/↓ to reorder, Enter/Esc to finish');
    }
  };

  useInput((input, key) => {
    if (view === 'editor') return;

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
        setIsMoving(false);
        showToast('Exit move mode');
      } else if (key.upArrow || input === 'k') {
        moveItemInList(selectedIndex, selectedIndex - 1);
      } else if (key.downArrow || input === 'j') {
        moveItemInList(selectedIndex, selectedIndex + 1);
      }
      return;
    }

    // Special keys
    if (key.upArrow) return updateSelectedIndex(Math.max(0, selectedIndex - 1));
    if (key.downArrow) return updateSelectedIndex(Math.min(currentList.length - 1, selectedIndex + 1));
    if (key.rightArrow) return handleNextTab();
    if (key.leftArrow) return handlePrevTab();
    if (key.return) return handleEdit();
    if (key.escape && searchQuery) return setSearchQuery('');
    if (key.tab) return key.shift ? handlePrevTab() : handleNextTab();
    if (key.ctrl && input === 'y') return redo();

    // Command Map for character inputs
    const charCommands: Record<string, () => void> = {
      'q': exit,
      'k': () => updateSelectedIndex(Math.max(0, selectedIndex - 1)),
      'j': () => updateSelectedIndex(Math.min(currentList.length - 1, selectedIndex + 1)),
      'l': handleNextTab,
      'h': handlePrevTab,
      '/': () => setIsSearching(true),
      'u': undo,
      'm': handleStartMove,
      'd': handleArchiveRestore,
      'X': handleDeleteArchive,
      'N': handleProcessNext,
      'y': handleCopy,
      'e': handleEdit,
      'a': () => activeTab !== 'archive' && addPrompt('after'),
      'A': () => activeTab !== 'archive' && addPrompt('end'),
      'i': () => activeTab !== 'archive' && addPrompt('before'),
      'I': () => activeTab !== 'archive' && addPrompt('start'),
    };

    if (charCommands[input]) {
      charCommands[input]();
    }
  });

  if (isLoading) {
    return (
      <Box padding={1} width="100%" height="100%" justifyContent="center" alignItems="center">
        <Box>
          <Text color="yellow">
            <Spinner type="dots" />
          </Text>
          <Text> Loading prompts...</Text>
        </Box>
      </Box>
    );
  }

  if (view === 'editor' && editingPrompt) {
    return (
      <EditorView
        key={editingPrompt.id}
        initialText={editingPrompt.text}
        terminalSize={terminalSize}
        onSave={saveEditedPrompt}
        onCancel={cancelEdit}
      />
    );
  }

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <Box flexDirection="column" paddingX={1} paddingTop={1} flexGrow={1}>
        <Header activeTab={activeTab} orderedTabs={orderedTabs} />

        <PromptList 
          currentList={currentList}
          selectedIndex={selectedIndex}
          isMoving={isMoving}
          lastCopiedId={lastCopiedId}
          terminalSize={terminalSize}
          initialViewportSize={initialViewportSize}
        />

        <SearchInput 
          isSearching={isSearching}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          updateSelectedIndex={updateSelectedIndex}
        />
      </Box>

      <Footer activeTab={activeTab} toast={toast} />
    </Box>
  );
};
