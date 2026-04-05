import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { Tab, Settings } from '../hooks/types';
import { UncontrolledSingleLineInput } from './UncontrolledSingleLineInput';

interface SettingsViewProps {
  settings: Settings;
  onUpdateSettings: (settings: Settings, immediateSave: boolean) => void;
  terminalSize: { columns: number; rows: number };
}

const ALL_TABS: Tab[] = ['main', 'notes', 'canned', 'snippets', 'archive', 'settings'];

const tabLabels: Record<Tab, string> = {
  main: '1. Prompt',
  notes: '2. Notes',
  canned: '3. Canned',
  snippets: '4. Snippets',
  archive: '5. Archive',
  settings: 'Settings',
};

const slashCommandRegex = /^\/[a-zA-Z0-9]+([:\-_][a-zA-Z0-9]+)*$/;

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  terminalSize,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewportOffset, setViewportOffset] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // null means not editing, -1 means adding new
  const [editingValue, setEditingValue] = useState('');

  const slashCommands = settings.slashCommands || [];
  const totalItems = ALL_TABS.length + slashCommands.length + 1; // +1 for "Add New"

  const isEditingValueValid = slashCommandRegex.test(editingValue);

  // Calculate available height for the list
  // Header (~4 lines) + Footer (~5 lines) + Title (3 lines) + Indicators/Spacing (3 lines) = ~15 lines reserved
  const reservedLines = 15;
  const availableHeight = Math.max(3, terminalSize.rows - reservedLines);

  // Update viewport when selectedIndex changes
  useEffect(() => {
    if (selectedIndex < viewportOffset) {
      setViewportOffset(selectedIndex);
    } else if (selectedIndex >= viewportOffset + availableHeight) {
      setViewportOffset(selectedIndex - availableHeight + 1);
    }
  }, [selectedIndex, availableHeight, viewportOffset]);

  useInput((input, key) => {
    if (editingIndex !== null) {
        if (key.escape) {
            setEditingIndex(null);
            setEditingValue('');
        }
        return;
    }

    if (key.upArrow || input === 'k') {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex(Math.min(totalItems - 1, selectedIndex + 1));
    } else if (key.return || input === ' ') {
      if (selectedIndex < ALL_TABS.length) {
        // Toggle tab visibility
        const tab = ALL_TABS[selectedIndex];
        const newVisibility = {
          ...settings.tabVisibility,
          [tab]: !settings.tabVisibility[tab],
        };
        onUpdateSettings({ ...settings, tabVisibility: newVisibility }, true);
      } else {
        // Slash command action
        const slashIdx = selectedIndex - ALL_TABS.length;
        if (slashIdx === slashCommands.length) {
          // Add new
          setEditingIndex(-1);
          setEditingValue('/');
        } else {
          // Edit existing
          setEditingIndex(slashIdx);
          setEditingValue('/' + slashCommands[slashIdx]);
        }
      }
    } else if (input === 'd' && selectedIndex >= ALL_TABS.length) {
      const slashIdx = selectedIndex - ALL_TABS.length;
      if (slashIdx < slashCommands.length) {
        const newSlashCommands = [...slashCommands];
        newSlashCommands.splice(slashIdx, 1);
        onUpdateSettings({ ...settings, slashCommands: newSlashCommands }, true);
      }
    }
  });

  const handleFinishEditing = () => {
    if (isEditingValueValid) {
      const cmdWithoutSlash = editingValue.slice(1);
      let newSlashCommands = [...slashCommands];
      
      if (editingIndex === -1) {
        // Adding new
        if (!newSlashCommands.includes(cmdWithoutSlash)) {
          newSlashCommands.push(cmdWithoutSlash);
        }
      } else if (editingIndex !== null) {
        // Updating existing
        newSlashCommands[editingIndex] = cmdWithoutSlash;
      }
      
      newSlashCommands.sort();
      onUpdateSettings({ ...settings, slashCommands: newSlashCommands }, true);
      setEditingIndex(null);
      setEditingValue('');
      
      // Update selected index to match the new position of the command if it was moved due to sort
      if (editingIndex === -1 || editingIndex !== null) {
          const newIdx = newSlashCommands.indexOf(cmdWithoutSlash);
          if (newIdx !== -1) setSelectedIndex(ALL_TABS.length + newIdx);
      }
    }
  };

  const renderTabItem = (tab: Tab, index: number) => {
    const isSelected = index === selectedIndex;
    const isVisible = settings.tabVisibility[tab];
    
    return (
      <Box key={tab} paddingX={1} backgroundColor={isSelected ? '#334455' : undefined}>
        <Text color={isSelected ? 'white' : 'gray'}>
          {isSelected ? '▶ ' : '  '}
        </Text>
        <Box width={3}>
          <Text color={isVisible ? 'green' : 'red'}>
            {isVisible ? '[x]' : '[ ]'}
          </Text>
        </Box>
        <Text color={isSelected ? 'white' : 'white'}>
          {tabLabels[tab]}
        </Text>
      </Box>
    );
  };

  const renderSlashItem = (cmd: string, index: number) => {
    const actualIndex = ALL_TABS.length + index;
    const isSelected = actualIndex === selectedIndex && editingIndex === null;
    const isEditing = editingIndex === index;
    
    return (
      <Box key={cmd} paddingX={1} backgroundColor={isSelected || isEditing ? '#334455' : undefined}>
        <Text color={isSelected || isEditing ? 'white' : 'gray'}>
          {isSelected || isEditing ? '▶ ' : '  '}
        </Text>
        {isEditing ? (
          <UncontrolledSingleLineInput 
            initialValue={editingValue}
            onChange={setEditingValue}
            onEnter={handleFinishEditing}
            onEscape={() => { setEditingIndex(null); setEditingValue(''); }}
            focus={true}
            color={isEditingValueValid ? 'white' : 'red'}
          />
        ) : (
          <Box>
            <Text color={isSelected ? 'white' : 'white'}>/{cmd}</Text>
            {isSelected && <Text color="gray"> (Press Enter to edit, 'd' to delete)</Text>}
          </Box>
        )}
      </Box>
    );
  };

  const renderAddNewSlash = () => {
    const actualIndex = ALL_TABS.length + slashCommands.length;
    const isSelected = actualIndex === selectedIndex && editingIndex === null;
    const isAdding = editingIndex === -1;

    return (
      <Box 
          paddingX={1} 
          backgroundColor={isSelected || isAdding ? '#334455' : undefined}
      >
        <Text color={isSelected || isAdding ? 'white' : 'gray'}>
          {isSelected || isAdding ? '▶ ' : '  '}
        </Text>
        {isAdding ? (
          <UncontrolledSingleLineInput 
            initialValue={editingValue}
            onChange={setEditingValue}
            onEnter={handleFinishEditing}
            onEscape={() => { setEditingIndex(null); setEditingValue(''); }}
            focus={true}
            color={isEditingValueValid ? 'cyan' : 'red'}
          />
        ) : (
          <Text color="cyan">[Add New Command]</Text>
        )}
      </Box>
    );
  };

  // Build the list of all items to render
  const allItems = [
    ...ALL_TABS.map((tab, i) => ({ type: 'tab', tab, index: i })),
    ...slashCommands.map((cmd, i) => ({ type: 'slash', cmd, index: i })),
    { type: 'addNew' }
  ];

  const visibleItems = allItems.slice(viewportOffset, viewportOffset + availableHeight);

  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1}>
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan" borderStyle="single" paddingX={1}> Settings </Text>
      </Box>

      {viewportOffset > 0 && <Text dimColor align="center">↑ more ↑</Text>}

      <Box flexDirection="column">
        {/* Render titles and items based on what's visible */}
        {/* We need to determine if titles should be shown */}
        
        {/* Tab Visibility Section Title */}
        {viewportOffset <= 0 && (
          <Box marginTop={0} marginBottom={0}>
             <Text bold underline>Tab Visibility</Text>
          </Box>
        )}
        
        {allItems.map((item, i) => {
          if (i < viewportOffset || i >= viewportOffset + availableHeight) return null;

          const elements = [];
          
          // Show section title for Slash Commands if it's the first time it appears or if it's the first visible item and it's a slash command
          if (item.type === 'slash' && item.index === 0) {
            elements.push(
              <Box key="slash-title" marginTop={1} marginBottom={0}>
                <Text bold underline>Slash Commands</Text>
              </Box>
            );
          } else if (item.type === 'addNew' && slashCommands.length === 0) {
             elements.push(
                <Box key="slash-title" marginTop={1} marginBottom={0}>
                  <Text bold underline>Slash Commands</Text>
                </Box>
              );
          }

          if (item.type === 'tab') {
            elements.push(renderTabItem((item as any).tab, (item as any).index));
          } else if (item.type === 'slash') {
            elements.push(renderSlashItem((item as any).cmd, (item as any).index));
          } else if (item.type === 'addNew') {
            elements.push(renderAddNewSlash());
          }

          return <React.Fragment key={i}>{elements}</React.Fragment>;
        })}
      </Box>

      {viewportOffset + availableHeight < totalItems && <Text dimColor align="center">↓ more ↓</Text>}

      {editingIndex !== null && !isEditingValueValid && editingValue.length > 1 && (
         <Box paddingX={1} marginTop={1}>
            <Text color="red">Invalid format! Must start with / and contain only alphanumeric and : - _</Text>
         </Box>
      )}
    </Box>
  );
};
