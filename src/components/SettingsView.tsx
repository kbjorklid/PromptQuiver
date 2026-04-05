import React, { useState } from 'react';
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

type SettingsSection = 'tabVisibility' | 'slashCommands';

const slashCommandRegex = /^\/[a-zA-Z0-9]+([:\-_][a-zA-Z0-9]+)*$/;

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  terminalSize,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('tabVisibility');
  const [tabSelectedIndex, setTabSelectedIndex] = useState(0);
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // null means not editing, -1 means adding new
  const [editingValue, setEditingValue] = useState('');

  const slashCommands = settings.slashCommands || [];
  const isEditingValueValid = slashCommandRegex.test(editingValue);

  useInput((input, key) => {
    if (editingIndex !== null) {
        if (key.escape) {
            setEditingIndex(null);
            setEditingValue('');
        }
        return;
    }

    if (key.upArrow || input === 'k') {
      if (activeSection === 'tabVisibility') {
        setTabSelectedIndex(Math.max(0, tabSelectedIndex - 1));
      } else {
        setSlashSelectedIndex(Math.max(0, slashSelectedIndex - 1));
      }
    } else if (key.downArrow || input === 'j') {
      if (activeSection === 'tabVisibility') {
        setTabSelectedIndex(Math.min(ALL_TABS.length - 1, tabSelectedIndex + 1));
      } else {
        setSlashSelectedIndex(Math.min(slashCommands.length, slashSelectedIndex + 1));
      }
    } else if (key.leftArrow || input === 'h') {
      setActiveSection('tabVisibility');
    } else if (key.rightArrow || input === 'l') {
      setActiveSection('slashCommands');
    } else if (key.return || input === ' ') {
      if (activeSection === 'tabVisibility') {
        const tab = ALL_TABS[tabSelectedIndex];
        const newVisibility = {
          ...settings.tabVisibility,
          [tab]: !settings.tabVisibility[tab],
        };
        onUpdateSettings({ ...settings, tabVisibility: newVisibility }, true);
      } else {
        if (slashSelectedIndex === slashCommands.length) {
          // Add new
          setEditingIndex(-1);
          setEditingValue('/');
        } else {
          // Edit existing
          setEditingIndex(slashSelectedIndex);
          setEditingValue('/' + slashCommands[slashSelectedIndex]);
        }
      }
    } else if (input === 'd' && activeSection === 'slashCommands' && slashSelectedIndex < slashCommands.length) {
      const newSlashCommands = [...slashCommands];
      newSlashCommands.splice(slashSelectedIndex, 1);
      onUpdateSettings({ ...settings, slashCommands: newSlashCommands }, true);
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
          if (newIdx !== -1) setSlashSelectedIndex(newIdx);
      }
    }
  };

  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1}>
      <Box flexDirection="row" marginBottom={1}>
        <Box 
          borderStyle="round" 
          borderColor={activeSection === 'tabVisibility' ? 'cyan' : 'gray'} 
          paddingX={1}
          marginRight={2}
        >
          <Text bold color={activeSection === 'tabVisibility' ? 'cyan' : 'white'}> Tab Visibility </Text>
        </Box>
        <Box 
          borderStyle="round" 
          borderColor={activeSection === 'slashCommands' ? 'cyan' : 'gray'} 
          paddingX={1}
        >
          <Text bold color={activeSection === 'slashCommands' ? 'cyan' : 'white'}> Slash Commands </Text>
        </Box>
      </Box>

      {activeSection === 'tabVisibility' ? (
        <Box flexDirection="column">
          <Box flexDirection="column" marginBottom={1}>
            <Text dimColor>Toggle visibility of tabs in the header and navigation.</Text>
          </Box>
          {ALL_TABS.map((tab, index) => {
            const isSelected = index === tabSelectedIndex;
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
          })}
        </Box>
      ) : (
        <Box flexDirection="column">
          <Box flexDirection="column" marginBottom={1}>
            <Text dimColor>Manage custom slash commands for the coding agent.</Text>
          </Box>
          
          <Box flexDirection="column" marginBottom={1}>
            {slashCommands.map((cmd, index) => {
              const isSelected = index === slashSelectedIndex && editingIndex === null;
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
            })}
            
            <Box 
                paddingX={1} 
                backgroundColor={(slashSelectedIndex === slashCommands.length && editingIndex === null) || editingIndex === -1 ? '#334455' : undefined}
            >
              <Text color={(slashSelectedIndex === slashCommands.length && editingIndex === null) || editingIndex === -1 ? 'white' : 'gray'}>
                {(slashSelectedIndex === slashCommands.length && editingIndex === null) || editingIndex === -1 ? '▶ ' : '  '}
              </Text>
              {editingIndex === -1 ? (
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
          </Box>

          {editingIndex !== null && !isEditingValueValid && editingValue.length > 1 && (
             <Box paddingX={1}>
                <Text color="red">Invalid format! Must start with / and contain only alphanumeric and : - _</Text>
             </Box>
          )}
        </Box>
      )}

    </Box>
  );
};
