import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import Spinner from 'ink-spinner';
import { EditorView } from './components/EditorView';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchInput } from './components/SearchInput';
import { PromptList } from './components/PromptList';
import { SettingsView } from './components/SettingsView';
import { loadPrompts, savePrompts } from './storage';
import clipboardy from 'clipboardy';
import { usePrompts } from './hooks/usePrompts';
import type { Tab, Settings } from './hooks/types';
import { expandSnippets } from './utils/snippetExpansion';

const useTerminalSize = () => {
  const [size, setSize] = useState({
    columns: process.stdout.columns || 100,
    rows: process.stdout.rows || 20,
  });

  useEffect(() => {
    const handler = () => {
      setSize({
        columns: process.stdout.columns || 100,
        rows: process.stdout.rows || 20,
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
    stagePrompt,
    updateSettings,
    branchFilterEnabled,
    toggleBranchFilter,
    currentBranch,
  } = usePrompts({ cwd, loadPromptsFn, savePromptsFn, debounceMs });

  const allTabs: Tab[] = ['main', 'notes', 'canned', 'snippets', 'archive', 'settings'];
  const defaultSettings: Settings = {
    tabVisibility: {
      main: true,
      notes: true,
      canned: true,
      snippets: true,
      archive: true,
      settings: true,
    },
    slashCommands: [],
  };
  const tabVisibility = (data.settings || defaultSettings).tabVisibility;
  const orderedTabs = allTabs.filter(tab => tabVisibility[tab]);

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
        const expandedText = activeTab === 'snippets' ? prompt.text : expandSnippets(prompt.text, data.snippets);
        clipboardy.writeSync(expandedText);
        setLastCopiedId(prompt.id);
        showToast('Copied to clipboard');
      } catch (e) {
        showToast('Failed to copy to clipboard');
      }
    }
  };

  const handleStage = () => {
    if (activeTab === 'notes' || activeTab === 'snippets' || activeTab === 'archive' || activeTab === 'settings') return;
    const prompt = currentList[selectedIndex];
    if (prompt) {
      if (activeTab === 'canned') {
        stagePrompt(); // Clears others via reducer
        try {
          const expandedText = expandSnippets(prompt.text, data.snippets);
          clipboardy.writeSync(expandedText);
          setLastCopiedId(prompt.id); // Show 📋
          showToast('Copied to clipboard (other staged items archived)');
        } catch (e) {
          showToast('Clipboard error');
        }
        return;
      }

      const wasStaged = prompt.staged;
      stagePrompt();
      if (!wasStaged) {
        try {
          const expandedText = activeTab === 'snippets' ? prompt.text : expandSnippets(prompt.text, data.snippets);
          clipboardy.writeSync(expandedText);
          setLastCopiedId(null);
          showToast('Staged and copied to clipboard');
        } catch (e) {
          showToast('Staged (clipboard error)');
        }
      } else {
        showToast('Unstaged');
      }
    }
  };

  const handleEdit = () => {
    const prompt = currentList[selectedIndex];
    if (prompt) {
      openEditor(prompt);
    }
  };

  const handleArchive = () => {
    if (currentList.length === 0) return;
    if (activeTab === 'archive') {
      deletePrompt('archive', selectedIndex);
    } else {
      movePrompt(activeTab, 'archive', selectedIndex);
    }
  };

  const handleRestore = () => {
    if (activeTab === 'archive' && currentList.length > 0) {
      movePrompt('archive', 'main', selectedIndex);
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

    // Tab shortcuts - ALWAYS allow
    if (/^[1-9]$/.test(input)) {
      const tabIndex = parseInt(input) - 1;
      if (tabIndex < orderedTabs.length) {
        setActiveTab(orderedTabs[tabIndex]);
      }
      return;
    }

    // Command Map for character inputs that should ALWAYS work
    const globalCharCommands: Record<string, () => void> = {
      'q': exit,
      'S': () => setActiveTab('settings'),
    };

    if (globalCharCommands[input]) {
      globalCharCommands[input]();
      return;
    }

    if (key.ctrl && input === 's') {
      setActiveTab('settings');
      return;
    }

    // Global navigation keys - ALWAYS allow
    if (key.tab) {
      key.shift ? handlePrevTab() : handleNextTab();
      return;
    }

    if (key.ctrl && input === 'y') return redo();
    if (input === 'u') return undo();

    // If in settings, don't handle other keys here (SettingsView will handle them)
    if (activeTab === 'settings') {
      if (key.rightArrow || input === 'l') return handleNextTab();
      if (key.leftArrow || input === 'h') return handlePrevTab();
      return;
    }

    // Special keys
    if (key.upArrow) return updateSelectedIndex(Math.max(0, selectedIndex - 1));
    if (key.downArrow) return updateSelectedIndex(Math.min(currentList.length - 1, selectedIndex + 1));
    if (key.rightArrow) return handleNextTab();
    if (key.leftArrow) return handlePrevTab();
    if (key.return) return handleEdit();
    if (key.escape && searchQuery) return setSearchQuery('');

    // Command Map for character inputs
    const charCommands: Record<string, () => void> = {
      'k': () => updateSelectedIndex(Math.max(0, selectedIndex - 1)),
      'j': () => updateSelectedIndex(Math.min(currentList.length - 1, selectedIndex + 1)),
      'l': handleNextTab,
      'h': handlePrevTab,
      '/': () => setIsSearching(true),
      'm': handleStartMove,
      'd': handleArchive,
      'r': handleRestore,
      's': handleStage,
      'y': handleCopy,
      'e': handleEdit,
      'a': () => activeTab !== 'archive' && addPrompt('after'),
      'A': () => activeTab !== 'archive' && addPrompt('end'),
      'i': () => activeTab !== 'archive' && addPrompt('before'),
      'I': () => activeTab !== 'archive' && addPrompt('start'),
      'b': toggleBranchFilter,
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
    const canStage = activeTab !== 'snippets' && activeTab !== 'notes';
    return (
      <EditorView
        key={editingPrompt.id}
        initialText={editingPrompt.text}
        initialName={editingPrompt.name}
        isSnippet={activeTab === 'snippets'}
        canStage={canStage}
        terminalSize={terminalSize}
        onSave={(text, name, shouldStage) => {
          saveEditedPrompt(text, name, shouldStage);
          if (shouldStage) {
            try {
              const expandedText = activeTab === 'snippets' ? text : expandSnippets(text, data.snippets);
              clipboardy.writeSync(expandedText);
              setLastCopiedId(null);
            } catch (e) {
              showToast(shouldStage ? 'Saved and Staged (clipboard error)' : 'Saved (clipboard error)');
            }
          }
        }}
        onCancel={cancelEdit}
        snippets={data.snippets}
        canned={data.canned}
        slashCommands={data.settings?.slashCommands || []}
      />
    );
  }

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <Box flexDirection="column" paddingX={1} paddingTop={1} flexGrow={1}>
        <Header 
          activeTab={activeTab} 
          orderedTabs={orderedTabs} 
          terminalSize={terminalSize}
        />

        {activeTab === 'settings' ? (
          <SettingsView 
            settings={data.settings || defaultSettings}
            onUpdateSettings={updateSettings}
            terminalSize={terminalSize}
          />
        ) : (
          <>
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
          </>
        )}
      </Box>

      <Footer 
        activeTab={activeTab} 
        toast={toast} 
        data={data} 
        cwd={cwd} 
        branchFilterEnabled={branchFilterEnabled} 
        currentBranch={currentBranch} 
        terminalSize={terminalSize}
        itemCount={currentList.length}
      />
    </Box>
  );
};
