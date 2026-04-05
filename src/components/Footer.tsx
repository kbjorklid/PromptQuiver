import React from 'react';
import { Box, Text } from 'ink';
import type { Tab, Toast } from '../hooks/usePrompts';
import type { PromptStorageData } from '../storage';

interface FooterProps {
  activeTab: Tab;
  toast: Toast | null;
  data: PromptStorageData;
  cwd: string;
  branchFilterEnabled?: boolean;
  currentBranch?: string;
  terminalSize?: { columns: number; rows: number };
  itemCount?: number;
}

const formatCwd = (cwd: string) => {
  const parts = cwd.split(/[/\\]/).filter(Boolean);
  if (parts.length <= 2) return cwd;
  return `.../${parts.slice(-2).join('/')}`;
};

const StatusItem = ({ 
  label, 
  value, 
  color, 
  bold, 
  showLabel 
}: { 
  label: string; 
  value: string | number; 
  color: string; 
  bold?: boolean; 
  showLabel: boolean;
}) => (
  <Box marginRight={2}>
    {showLabel && <Text color="white" dimColor>{label}</Text>}
    <Text color={color} bold={bold}>{value}</Text>
  </Box>
);

export const Footer: React.FC<FooterProps> = ({ 
  activeTab, 
  toast, 
  data, 
  cwd, 
  branchFilterEnabled, 
  currentBranch,
  terminalSize,
  itemCount = 0
}) => {
  const columns = terminalSize?.columns || 80;
  const formattedCwd = formatCwd(cwd);
  const promptCountText = `${data.main.length} prompts`;
  
  // Calculate approximate width needed for labels
  const labelsWidth = 8 + 4 + 7; // "quiver: " (8) + "pwd: " (4) + "branch: " (7)
  const contentWidth = promptCountText.length + formattedCwd.length + (currentBranch?.length || 0) + 6; // +6 for margins
  const showLabels = columns > (contentWidth + labelsWidth);

  const renderShortcuts = () => {
    if (activeTab === 'settings') {
      return (
        <>
          <Box><Text bold>[Tab/←/→/h/l]</Text><Text color="gray"> Tab</Text></Box>
          <Box><Text bold>[↑/↓/j/k]</Text><Text color="gray"> Nav</Text></Box>
          <Box><Text bold>[Enter/Space]</Text><Text color="gray"> Action</Text></Box>
          <Box><Text bold>[Esc]</Text><Text color="gray"> Cancel</Text></Box>
          <Box><Text bold>[d]</Text><Text color="gray"> Delete</Text></Box>
          <Box><Text bold>[u/Ctrl+y]</Text><Text color="gray"> Undo/Redo</Text></Box>
          <Box><Text bold>[q]</Text><Text color="gray"> Quit</Text></Box>
        </>
      );
    }

    const hasItems = itemCount > 0;

    return (
      <>
        <Box><Text bold>[Tab/h/l]</Text><Text color="gray"> Tab</Text></Box>
        {hasItems && <Box><Text bold>[↑/↓/j/k]</Text><Text color="gray"> Nav</Text></Box>}
        {hasItems && <Box><Text bold>[Enter/e]</Text><Text color="gray"> Edit</Text></Box>}
        {activeTab !== 'archive' && hasItems && (
          <Box><Text bold>[m]</Text><Text color="gray"> Move</Text></Box>
        )}
        {activeTab !== 'notes' && hasItems && (
          <Box><Text bold>[y]</Text><Text color="gray"> Yank</Text></Box>
        )}
        <Box><Text bold>[/]</Text><Text color="gray"> Filter</Text></Box>
        {activeTab !== 'archive' && (
          <Box><Text bold>[a/A/i/I]</Text><Text color="gray"> Add</Text></Box>
        )}
        {activeTab === 'archive' ? (
          hasItems && (
            <>
              <Box><Text bold>[r]</Text><Text color="gray"> Restore</Text></Box>
              <Box><Text bold>[d]</Text><Text color="gray"> Delete</Text></Box>
            </>
          )
        ) : (
          hasItems && <Box><Text bold>[d]</Text><Text color="gray"> Archive</Text></Box>
        )}
        {activeTab !== 'archive' && activeTab !== 'settings' && activeTab !== 'notes' && activeTab !== 'snippets' && hasItems && (
          <Box><Text bold>[s]</Text><Text color="gray"> Stage</Text></Box>
        )}
        <Box><Text bold>[S]</Text><Text color="gray"> Settings</Text></Box>
        <Box><Text bold>[u/Ctrl+y]</Text><Text color="gray"> Undo/Redo</Text></Box>
        <Box><Text bold>[q]</Text><Text color="gray"> Quit</Text></Box>
      </>
    );
  };

  return (
    <Box flexDirection="column">
      {toast && (
        <Box 
          position="absolute" 
          width="100%" 
          justifyContent="center"
          marginTop={-4}
        >
          <Box borderStyle="round" borderColor="yellow" paddingX={2} backgroundColor="black">
            <Text bold color="yellow">{toast.message}</Text>
          </Box>
        </Box>
      )}

      <Box marginTop={1} paddingX={1} flexWrap="wrap" columnGap={2} marginBottom={1}>
        {renderShortcuts()}
      </Box>

      <Box width="100%" backgroundColor="darkCyan" paddingX={1}>
        <StatusItem 
          label="quiver: " 
          value={promptCountText} 
          color="blue" 
          bold 
          showLabel={showLabels} 
        />
        
        <StatusItem 
          label="pwd: " 
          value={formattedCwd} 
          color="magenta" 
          showLabel={showLabels} 
        />

        {currentBranch && (
          <StatusItem 
            label="branch: " 
            value={currentBranch} 
            color={branchFilterEnabled ? "yellow" : "gray"} 
            bold={branchFilterEnabled} 
            showLabel={showLabels} 
          />
        )}
      </Box>
    </Box>
  );
};
