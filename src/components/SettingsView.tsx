import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Tab, Settings } from '../hooks/types';

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

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  terminalSize,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex(Math.min(ALL_TABS.length - 1, selectedIndex + 1));
    } else if (key.return || input === ' ') {
      const tab = ALL_TABS[selectedIndex];
      const newVisibility = {
        ...settings.tabVisibility,
        [tab]: !settings.tabVisibility[tab],
      };
      
      // Ensure at least one tab is visible (optional, but good for UX)
      // Actually, if settings is hidden, how do they get back? 
      // User can always use shortcuts 1-5 or ctrl-s.
      
      onUpdateSettings({ tabVisibility: newVisibility }, true);
    }
  });

  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1}>
      <Box marginBottom={1} borderStyle="round" borderColor="cyan" paddingX={1}>
        <Text bold color="cyan"> Tab Visibility Settings </Text>
      </Box>
      
      <Box flexDirection="column" marginBottom={1}>
        <Text dimColor>Toggle visibility of tabs in the header and navigation.</Text>
        <Text dimColor>Navigation shortcuts (1-5, Ctrl-S) will still work.</Text>
      </Box>

      <Box flexDirection="column">
        {ALL_TABS.map((tab, index) => {
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
        })}
      </Box>

      <Box marginTop={2} borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column">
        <Text color="gray">Shortcuts:</Text>
        <Text color="gray">  [↑/↓] or [j/k] to navigate</Text>
        <Text color="gray">  [Enter] or [Space] to toggle</Text>
      </Box>
    </Box>
  );
};
