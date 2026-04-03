import React from 'react';
import { Box, Text } from 'ink';
import type { Prompt } from '../storage/paths';

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
  if (currentList.length === 0) {
    return (
      <Box justifyContent="center" marginTop={2}>
        <Text color="gray">No items yet</Text>
      </Box>
    );
  }

  const VIEWPORT_SIZE = initialViewportSize || Math.max(3, terminalSize.rows - 15);
  const half = Math.floor(VIEWPORT_SIZE / 2);
  let start = Math.max(0, selectedIndex - half);
  let end = Math.min(currentList.length, start + VIEWPORT_SIZE);
  
  if (end - start < VIEWPORT_SIZE) {
    start = Math.max(0, end - VIEWPORT_SIZE);
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
