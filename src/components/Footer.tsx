import React from 'react';
import { Box, Text } from 'ink';
import type { Tab, Toast } from '../hooks/usePrompts';

interface FooterProps {
  activeTab: Tab;
  toast: Toast | null;
}

export const Footer: React.FC<FooterProps> = ({ activeTab, toast }) => {
  return (
    <>
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

      <Box marginTop={1} paddingX={1} flexWrap="wrap" columnGap={2}>
        <Box><Text bold>[Tab/h/l]</Text><Text color="gray"> Tab</Text></Box>
        <Box><Text bold>[↑/↓/j/k]</Text><Text color="gray"> Nav</Text></Box>
        <Box><Text bold>[Enter/e]</Text><Text color="gray"> Edit</Text></Box>
        <Box><Text bold>[m]</Text><Text color="gray"> Move</Text></Box>
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
    </>
  );
};
