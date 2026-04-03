import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { Tabs, Tab as InkTab } from 'ink-tab';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import Gradient from 'ink-gradient';
import { EditorView } from './components/EditorView';
import { loadPrompts, savePrompts, PromptStorageData, Prompt } from './storage';
import { v4 as uuidv4 } from 'uuid';
import clipboardy from 'clipboardy';

type Tab = 'main' | 'notes' | 'archive';
type View = 'list' | 'editor';

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
  const [data, setData] = useState<PromptStorageData>({ main: [], notes: [], archive: [] });
  const [history, setHistory] = useState<PromptStorageData[]>([]);
  const [future, setFuture] = useState<PromptStorageData[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('main');
  const [selectedIndices, setSelectedIndices] = useState<Record<Tab, number>>({ main: 0, notes: 0, archive: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setData(loaded);
      setIsLoading(false);
    }
    init();
  }, [cwd, loadPromptsFn]);

  // Save whenever data changes
  useEffect(() => {
    if (!isLoading) {
      savePromptsFn(cwd, data);
    }
  }, [data, isLoading, cwd, savePromptsFn]);

  // Debug: log tab changes if we could, but let's just ensure no accidental resets.
  
  const fullList = data[activeTab];
  const currentList = searchQuery 
    ? fullList.filter(p => p.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : fullList;

  const selectedIndex = Math.min(
    selectedIndices[activeTab],
    Math.max(0, currentList.length - 1)
  );

  const updateSelectedIndex = (index: number) => {
    setSelectedIndices((prev) => ({
      ...prev,
      [activeTab]: index,
    }));
  };

  const pushState = useCallback((nextData: PromptStorageData) => {
    setHistory((prev) => [...prev, data]);
    setFuture([]);
    setData(nextData);
  }, [data]);

  const undo = useCallback(() => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setFuture((f) => [data, ...f]);
      setHistory((h) => h.slice(0, -1));
      setData(prev);
      showToast('Undo performed');
    }
  }, [history, data, showToast]);

  const redo = useCallback(() => {
    if (future.length > 0) {
      const next = future[0];
      setHistory((h) => [...h, data]);
      setFuture((f) => f.slice(1));
      setData(next);
      showToast('Redo performed');
    }
  }, [future, data, showToast]);

  const movePrompt = (from: Tab, to: Tab, index: number) => {
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
  };

  const deletePrompt = (tab: Tab, index: number) => {
    const list = [...data[tab]];
    list.splice(index, 1);
    pushState({
      ...data,
      [tab]: list,
    });
    showToast("Deleted. Press 'u' to undo (5s)");
  };

  const addPrompt = (position: 'before' | 'after' | 'start' | 'end') => {
    const now = new Date().toISOString();
    const type: 'prompt' | 'note' = activeTab === 'notes' ? 'note' : 'prompt';
    const newPrompt: Prompt = {
      id: uuidv4(),
      text: '',
      type,
      created_at: now,
      updated_at: now,
    };

    const list = [...data[activeTab]];
    let newIndex = 0;

    if (position === 'start') {
      list.unshift(newPrompt);
      newIndex = 0;
    } else if (position === 'end') {
      list.push(newPrompt);
      newIndex = list.length - 1;
    } else if (position === 'before') {
      list.splice(selectedIndex, 0, newPrompt);
      newIndex = selectedIndex;
    } else if (position === 'after') {
      if (list.length === 0) {
        list.push(newPrompt);
        newIndex = 0;
      } else {
        list.splice(selectedIndex + 1, 0, newPrompt);
        newIndex = selectedIndex + 1;
      }
    }

    const nextData = { ...data, [activeTab]: list };
    setData(nextData);
    
    updateSelectedIndex(newIndex);
    setEditingPrompt(newPrompt);
    setView('editor');
  };

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

    if (input === 'q') {
      exit();
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
      setActiveTab(orderedTabs[nextIndex]);
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
      if (data.main.length > 0) {
        const firstPrompt = data.main[0];
        try {
          clipboardy.writeSync(firstPrompt.text);
          showToast('Processed prompt and copied to clipboard');
        } catch (e) {
          showToast('Processed prompt (clipboard error)');
        }
        
        // Inline movePrompt logic to avoid double toast
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
      if (currentList.length > 0) {
        const prompt = currentList[selectedIndex];
        setEditingPrompt(prompt);
        setView('editor');
      }
    }

    if (input === 'y' && activeTab !== 'notes') {
      if (currentList.length > 0) {
        try {
          clipboardy.writeSync(currentList[selectedIndex].text);
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
        onSave={(text) => {
          const listName = activeTab;
          const list = [...data[listName]];
          const index = list.findIndex((p) => p.id === editingPrompt.id);
          if (index !== -1) {
            const nextData = { ...data };
            nextData[listName] = [...list];
            nextData[listName][index] = {
              ...editingPrompt,
              text: text,
              updated_at: new Date().toISOString(),
            };
            pushState(nextData);
            showToast('Saved');
          }
          setView('list');
          setEditingPrompt(null);
        }}
        onCancel={() => {
          setView('list');
          setEditingPrompt(null);
        }}
      />
    );
  }

  return (
    <Box flexDirection="column" padding={1} width="100%" height="100%">
      <Box marginBottom={1} flexDirection="column">
        <Gradient name="atlas">
          <Text bold italic>{">>> PROMPTCUE <<<"}</Text>
        </Gradient>
        <Box marginTop={1}>
          {orderedTabs.map((t, i) => (
            <React.Fragment key={t}>
              <Box paddingX={1} backgroundColor={activeTab === t ? 'blue' : undefined}>
                <Text color={activeTab === t ? 'black' : 'gray'}>{i + 1}. </Text>
                <Text bold={activeTab === t} color={activeTab === t ? 'black' : undefined}>
                  {t === 'main' ? 'Prompt' : t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Box>
              {i < orderedTabs.length - 1 && <Text color="gray"> | </Text>}
            </React.Fragment>
          ))}
        </Box>
      </Box>

      <Box flexDirection="column" flexGrow={1}>
        {currentList.length === 0 ? (
          <Box justifyContent="center" marginTop={2}>
            <Text color="gray">No items yet</Text>
          </Box>
        ) : (() => {
          const VIEWPORT_SIZE = initialViewportSize || Math.max(3, terminalSize.rows - 15);
          const half = Math.floor(VIEWPORT_SIZE / 2);
          let start = Math.max(0, selectedIndex - half);
          let end = Math.min(currentList.length, start + VIEWPORT_SIZE);
          
          if (end - start < VIEWPORT_SIZE) {
            start = Math.max(0, end - VIEWPORT_SIZE);
          }

          const items = currentList.slice(start, end);
          return items.map((prompt, index) => {
            const actualIndex = start + index;
            const displayLines = prompt.text
              .split('\n')
              .map((line) => line.trim())
              .filter((line) => line.length > 0)
              .slice(0, 2);
            
            const isSelected = actualIndex === selectedIndex;
            const itemColor = prompt.type === 'note' ? 'cyan' : 'yellow';
            const displayIndex = (actualIndex + 1).toString().padStart(currentList.length.toString().length, ' ');
            
            return (
              <Box 
                key={prompt.id} 
                flexDirection="column"
              >
                <Box 
                  paddingX={1}
                  backgroundColor={isSelected ? '#334455' : undefined}
                >
                  <Box marginRight={1}>
                    <Text color="gray">{displayIndex}. </Text>
                    <Text color={itemColor}>
                      {isSelected ? '▶' : ' '}
                    </Text>
                  </Box>
                  <Box flexDirection="column">
                    {displayLines.length === 0 ? (
                      <Text italic color="gray">Empty item</Text>
                    ) : (
                      displayLines.map((line, i) => (
                        <Text key={i} wrap="truncate-end" color={itemColor}>
                          {line}
                        </Text>
                      ))
                    )}
                  </Box>
                </Box>
                {index < items.length - 1 && (
                  <Text color="gray" wrap="truncate-end">
                    {"─".repeat(terminalSize.columns || 80)}
                  </Text>
                )}
              </Box>
            );
          });
        })()}
      </Box>

      {toast && (
        <Box 
          position="absolute" 
          width="100%" 
          justifyContent="center" 
          bottom={1}
        >
          <Box borderStyle="round" borderColor="yellow" paddingX={2} backgroundColor="black">
            <Text bold color="yellow">{toast.message}</Text>
          </Box>
        </Box>
      )}

      {isSearching ? (
        <Box paddingX={1} marginTop={1}>
          <Text color="blue">/</Text>
          <TextInput 
            value={searchQuery} 
            onChange={(val) => {
              setSearchQuery(val);
              updateSelectedIndex(0);
            }} 
          />
        </Box>
      ) : searchQuery ? (
        <Box paddingX={1} marginTop={1}>
          <Text color="gray">Filter: </Text>
          <Text color="blue">{searchQuery}</Text>
          <Text color="gray"> (press / to edit, Esc to clear)</Text>
        </Box>
      ) : null}

      <Box marginTop={1} paddingX={1} flexWrap="wrap" columnGap={2}>
        <Box><Text bold>[Tab/h/l]</Text><Text color="gray"> Tab</Text></Box>
        <Box><Text bold>[↑/↓/j/k]</Text><Text color="gray"> Nav</Text></Box>
        <Box><Text bold>[Enter/e]</Text><Text color="gray"> Edit</Text></Box>
        {activeTab !== 'notes' && (
          <Box><Text bold>[y]</Text><Text color="gray"> Yank</Text></Box>
        )}
        <Box><Text bold>[/]</Text><Text color="gray"> Filter</Text></Box>
        {activeTab !== 'archive' && (
          <Box><Text bold>[a/A/i/I]</Text><Text color="gray"> Add</Text></Box>
        )}
        <Box><Text bold>[d]</Text><Text color="gray"> {activeTab === 'archive' ? 'Restore' : 'Archive'}</Text></Box>
        {activeTab === 'main' && (
          <Box><Text bold>[N]</Text><Text color="gray"> Process</Text></Box>
        )}
        <Box><Text bold>[u/Ctrl+y]</Text><Text color="gray"> Undo/Redo</Text></Box>
        <Box><Text bold>[q]</Text><Text color="gray"> Quit</Text></Box>
      </Box>
    </Box>
  );
};
