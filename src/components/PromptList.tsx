import React from 'react';
import { Box, Text } from 'ink';
import type { Prompt } from '../storage/paths';
import { useViewport } from '../hooks/useViewport';
import { SelectableRow } from './ui/SelectableRow';
import { Indicator } from './ui/Indicator';
import { Divider } from './ui/Divider';
import { Badge } from './ui/Badge';
import { getCommentTitle } from '../utils/comments';

interface PromptListProps {
  currentList: Prompt[];
  selectedIndex: number;
  isMoving: boolean;
  lastCopiedId: string | null;
  terminalSize: { columns: number; rows: number };
  initialViewportSize?: number;
  isSearching?: boolean;
}

export const PromptList: React.FC<PromptListProps> = ({
  currentList,
  selectedIndex,
  isMoving,
  lastCopiedId,
  terminalSize,
  initialViewportSize,
  isSearching = false,
}) => {
  const { start, end } = useViewport({
    list: currentList,
    selectedIndex,
    terminalRows: terminalSize.rows,
    initialViewportSize,
    isSearching,
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
        const commentTitle = getCommentTitle(prompt.text);
        
        const displayLines = prompt.name 
          ? [prompt.name]
          : commentTitle
            ? [commentTitle]
            : prompt.text
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.length > 0)
                .slice(0, 2);
        
        const isSelected = actualIndex === selectedIndex;
        const isLastCopied = prompt.id === lastCopiedId;
        const isStaged = prompt.staged;
        const itemColor = prompt.type === 'note' ? 'cyan' : (prompt.name || commentTitle ? 'magenta' : 'yellow');
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
                <Text color="gray">{displayIndex}. </Text>
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
                    <Text key={i} wrap="truncate-end" color={itemColor} bold={isMoving && isSelected}>
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
      <Box flexGrow={1} minHeight={0} />
    </Box>
  );
};
