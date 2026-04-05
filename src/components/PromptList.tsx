import React from 'react';
import { Box, Text } from 'ink';
import type { Prompt } from '../storage/paths';
import { useViewport } from '../hooks/useViewport';
import { SelectableRow } from './ui/SelectableRow';
import { Indicator } from './ui/Indicator';
import { Divider } from './ui/Divider';
import { Badge } from './ui/Badge';

interface PromptListProps {
  currentList: Prompt[];
  selectedIndex: number;
  isMoving: boolean;
  lastCopiedId: string | null;
  terminalSize: { columns: number; rows: number };
  initialViewportSize?: number;
}

export const PromptList: React.FC<PromptListProps> = ({
  currentList,
  selectedIndex,
  isMoving,
  lastCopiedId,
  terminalSize,
  initialViewportSize,
}) => {
  const { start, end } = useViewport({
    totalItems: currentList.length,
    selectedIndex,
    terminalRows: terminalSize.rows,
    initialViewportSize,
  });

  if (currentList.length === 0) {
    return (
      <Box flexGrow={1} justifyContent="center" alignItems="center">
        <Text color="gray">No items yet</Text>
      </Box>
    );
  }

  const items = currentList.slice(start, end);
  
  return (
    <Box flexDirection="column" flexGrow={1}>
      {items.map((prompt, index) => {
        const actualIndex = start + index;
        const displayLines = prompt.name 
          ? [prompt.name]
          : prompt.text
              .split('\n')
              .map((line) => line.trim())
              .filter((line) => line.length > 0)
              .slice(0, 2);
        
        const isSelected = actualIndex === selectedIndex;
        const isLastCopied = prompt.id === lastCopiedId;
        const isStaged = prompt.staged;
        const itemColor = prompt.type === 'note' ? 'cyan' : (prompt.name ? 'magenta' : 'yellow');
        const displayIndex = (actualIndex + 1).toString().padStart(currentList.length.toString().length, ' ');
        
        return (
          <Box 
            key={prompt.id} 
            flexDirection="column"
          >
            <SelectableRow 
              isSelected={isSelected}
              isMoving={isMoving}
            >
              <Box marginRight={1} flexShrink={0}>
                <Text color="gray" dimColor={isStaged}>{displayIndex}. </Text>
                <Indicator 
                  isSelected={isSelected} 
                  isMoving={isMoving} 
                  activeColor={itemColor}
                  inactiveColor={itemColor}
                />
                {isLastCopied && <Badge color="green"> 📋</Badge>}
                {isStaged && <Badge color="red"> 🎯</Badge>}
              </Box>
              <Box flexDirection="column" flexShrink={1}>
                {displayLines.length === 0 ? (
                  <Text italic color="gray">Empty item</Text>
                ) : (
                  displayLines.map((line, i) => (
                    <Text key={i} wrap="truncate-end" color={itemColor} bold={isMoving && isSelected} dimColor={isStaged}>
                      {line}
                    </Text>
                  ))
                )}
              </Box>
            </SelectableRow>
            {index < items.length - 1 && (
              <Divider width={terminalSize.columns} />
            )}
          </Box>
        );
      })}
    </Box>
  );
};
