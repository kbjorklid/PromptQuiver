import React from 'react';
import { Box, Text } from 'ink';
import type { Prompt } from '../storage/paths';
import { useViewport } from '../hooks/useViewport';

interface PromptListProps {
  currentList: Prompt[];
  selectedIndex: number;
  isMoving: boolean;
  terminalSize: { columns: number; rows: number };
  initialViewportSize?: number;
}

export const PromptList: React.FC<PromptListProps> = ({
  currentList,
  selectedIndex,
  isMoving,
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
        const displayLines = prompt.text
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .slice(0, 2);
        
        const isSelected = actualIndex === selectedIndex;
        const itemColor = prompt.type === 'note' ? 'cyan' : 'yellow';
        const displayIndex = (actualIndex + 1).toString().padStart(currentList.length.toString().length, ' ');
        
        let backgroundColor: string | undefined = undefined;
        if (isSelected) {
          backgroundColor = isMoving ? '#445566' : '#334455';
        }

        return (
          <Box 
            key={prompt.id} 
            flexDirection="column"
          >
            <Box 
              paddingX={1}
              backgroundColor={backgroundColor}
            >
              <Box marginRight={1}>
                <Text color="gray">{displayIndex}. </Text>
                <Text color={itemColor}>
                  {isSelected ? (isMoving ? '↕' : '▶') : ' '}
                </Text>
              </Box>
              <Box flexDirection="column">
                {displayLines.length === 0 ? (
                  <Text italic color="gray">Empty item</Text>
                ) : (
                  displayLines.map((line, i) => (
                    <Text key={i} wrap="truncate-end" color={itemColor} bold={isMoving && isSelected}>
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
      })}
    </Box>
  );
};
