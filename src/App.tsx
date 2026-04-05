import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import Spinner from 'ink-spinner';
import { EditorView } from './components/EditorView';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchInput } from './components/SearchInput';
import { PromptList } from './components/PromptList';
import { SettingsView } from './components/SettingsView';
import { loadPrompts, savePrompts } from './storage';
import { usePrompts } from './hooks/usePrompts';
import type { Tab, Settings } from './hooks/types';
import { expandSnippets } from './utils/snippetExpansion';
import { useAppKeyboard } from './hooks/useAppKeyboard';
import { useModal } from './hooks/useModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { CLAUDE_COMMANDS } from './utils/claudeCommands';

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
  const { isModalOpen, modalConfig, showModal, closeModal, handleSelect } = useModal();
  
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
    copyToClipboard,
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
    enableClaudeCommands: false,
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
      // In handleCopy, if we are on 'snippets' tab, we don't expand snippets
      const expandedText = activeTab === 'snippets' ? prompt.text : expandSnippets(prompt.text, data.snippets);
      if (copyToClipboard(expandedText, 'Copied to clipboard')) {
        setLastCopiedId(prompt.id);
      }
    }
  };

  const handleStage = () => {
    if (activeTab === 'notes' || activeTab === 'snippets' || activeTab === 'archive' || activeTab === 'settings') return;
    const prompt = currentList[selectedIndex];
    if (prompt) {
      if (activeTab === 'canned') {
        stagePrompt(); // Clears others via reducer
        const expandedText = expandSnippets(prompt.text, data.snippets);
        if (copyToClipboard(expandedText, 'Copied to clipboard (other staged items archived)')) {
          setLastCopiedId(prompt.id); // Show 📋
        }
        return;
      }

      const wasStaged = prompt.staged;
      stagePrompt();
      if (!wasStaged) {
        // Here activeTab is NOT 'snippets' because of the early return above
        const expandedText = expandSnippets(prompt.text, data.snippets);
        if (copyToClipboard(expandedText, 'Staged and copied to clipboard')) {
          setLastCopiedId(null);
        } else {
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
      showModal({
        title: 'Permanently delete this prompt?',
        options: [
          { label: ' Yes ', value: 'yes' },
          { label: ' No ', value: 'no' }
        ],
        onSelect: (value) => {
          if (value === 'yes') {
            deletePrompt('archive', selectedIndex);
          }
        }
      });
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

  const handleEndMove = () => {
    setIsMoving(false);
    showToast('Exit move mode');
  };

  useAppKeyboard({
    view,
    activeTab,
    orderedTabs,
    setActiveTab,
    isSearching,
    setIsSearching,
    searchQuery,
    setSearchQuery,
    isMoving,
    setIsMoving,
    isModalOpen,
    selectedIndex,
    updateSelectedIndex,
    itemCount: currentList.length,
    handleNextTab,
    handlePrevTab,
    handleEdit,
    handleArchive,
    handleRestore,
    handleStartMove,
    handleEndMove,
    handleStage,
    handleCopy,
    addPrompt,
    toggleBranchFilter,
    undo,
    redo,
    moveItemInList,
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
    const baseSlashCommands = data.settings?.slashCommands || [];
    const mergedSlashCommands = Array.from(new Set([
      ...baseSlashCommands,
      ...(data.settings?.enableClaudeCommands ? CLAUDE_COMMANDS : [])
    ]));

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
            const expandedText = activeTab === 'snippets' ? text : expandSnippets(text, data.snippets);
            if (copyToClipboard(expandedText)) {
              setLastCopiedId(null);
            }
          }
        }}
        onCancel={cancelEdit}
        snippets={data.snippets}
        canned={data.canned}
        slashCommands={mergedSlashCommands}
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

      {isModalOpen && modalConfig && (
        <ConfirmDialog
          title={modalConfig.title}
          message={modalConfig.message}
          options={modalConfig.options}
          onSelect={handleSelect}
          onCancel={closeModal}
          terminalSize={terminalSize}
        />
      )}
    </Box>
  );
};
