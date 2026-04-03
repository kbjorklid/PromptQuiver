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
  viewportSize: initialViewportSize
}: { 
  cwd: string;
  loadPromptsFn?: typeof loadPrompts;
  savePromptsFn?: typeof savePrompts;
  viewportSize?: number;
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
  } = usePrompts({ cwd, loadPromptsFn, savePromptsFn });

  const orderedTabs: Tab[] = ['main', 'notes', 'archive'];

  useInput((input, key) => {
    if (view === 'editor') {
      return;
    }

    if (isSearching) {
      if (key.escape) {
        setIsSearching(false);
        setSearchQuery('');
        return;
      }
      if (key.return) {
        setIsSearching(false);
        return;
      }
      return;
    }

    if (isMoving) {
      if (key.escape || key.return || input === 'm') {
        setIsMoving(false);
        showToast('Exit move mode');
        return;
      }
      if (key.upArrow || input === 'k') {
        moveItemInList(selectedIndex, selectedIndex - 1);
      }
      if (key.downArrow || input === 'j') {
        moveItemInList(selectedIndex, selectedIndex + 1);
      }
      return;
    }

    if (input === 'q') {
      exit();
      return;
    }

    if (input === 'm' && view === 'list' && activeTab !== 'archive') {
      if (currentList.length > 0) {
        setIsMoving(true);
        showToast('Move mode: use ↑/↓ to reorder, Enter/Esc to finish');
      }
      return;
    }

    if (input === '/' && view === 'list') {
      setIsSearching(true);
      return;
    }

    if (key.escape && searchQuery && !isSearching) {
      setSearchQuery('');
      return;
    }

    const switchTab = (direction: 'next' | 'prev') => {
      const currentIndex = orderedTabs.indexOf(activeTab);
      const offset = direction === 'next' ? 1 : -1;
      const nextIndex = (currentIndex + offset + orderedTabs.length) % orderedTabs.length;
      const nextTab = orderedTabs[nextIndex];
      if (nextTab) {
        setActiveTab(nextTab);
      }
    };

    if (key.tab) {
      switchTab(key.shift ? 'prev' : 'next');
      return;
    }

    if (key.rightArrow || input === 'l') {
      switchTab('next');
      return;
    }

    if (key.leftArrow || input === 'h') {
      switchTab('prev');
      return;
    }

    if (key.upArrow || input === 'k') {
      updateSelectedIndex(Math.max(0, selectedIndex - 1));
    }

    if (key.downArrow || input === 'j') {
      updateSelectedIndex(Math.min(currentList.length - 1, selectedIndex + 1));
    }

    if (input === 'd') {
      if (currentList.length > 0) {
        if (activeTab === 'archive') {
          movePrompt('archive', 'main', selectedIndex);
        } else {
          movePrompt(activeTab, 'archive', selectedIndex);
        }
      }
    }

    if (input === 'X' && activeTab === 'archive') {
      if (currentList.length > 0) {
        deletePrompt('archive', selectedIndex);
      }
    }

    if (input === 'N' && activeTab === 'main') {
      const prompt = processNextPrompt();
      if (prompt) {
        try {
          clipboardy.writeSync(prompt.text);
          showToast('Processed prompt and copied to clipboard');
        } catch (e) {
          showToast('Processed prompt (clipboard error)');
        }
      }
    }

    if (input === 'u') {
      undo();
    }

    if (key.ctrl && input === 'y') {
      redo();
    }

    if (activeTab !== 'archive') {
      if (input === 'a') addPrompt('after');
      if (input === 'A') addPrompt('end');
      if (input === 'i') addPrompt('before');
      if (input === 'I') addPrompt('start');
    }

    if (input === 'e' || key.return) {
      const prompt = currentList[selectedIndex];
      if (prompt) {
        openEditor(prompt);
      }
    }

    if (input === 'y' && activeTab !== 'notes') {
      const prompt = currentList[selectedIndex];
      if (prompt) {
        try {
          clipboardy.writeSync(prompt.text);
          showToast('Copied to clipboard');
        } catch (e) {
          showToast('Failed to copy to clipboard');
        }
      }
    }
  });

  if (isLoading) {
    return (
      <Box padding={1}>
        <Text color="yellow">
          <Spinner type="dots" />
        </Text>
        <Text> Loading prompts...</Text>
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
    <Box flexDirection="column" padding={1} width="100%" height="100%">
      <Header activeTab={activeTab} orderedTabs={orderedTabs} />

      <PromptList 
        currentList={currentList}
        selectedIndex={selectedIndex}
        isMoving={isMoving}
        terminalSize={terminalSize}
        initialViewportSize={initialViewportSize}
      />

      <SearchInput 
        isSearching={isSearching}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        updateSelectedIndex={updateSelectedIndex}
      />

      <Footer activeTab={activeTab} toast={toast} />
    </Box>
  );
};
