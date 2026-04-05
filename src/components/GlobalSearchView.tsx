import React from 'react';
import { Box, Text, useInput } from 'ink';
import { UncontrolledSingleLineInput } from './UncontrolledSingleLineInput';
import { SelectableRow } from './ui/SelectableRow';
import { Indicator } from './ui/Indicator';
import { Divider } from './ui/Divider';
import { useViewport } from '../hooks/useViewport';
import type { GlobalSearchResult } from '../storage';

interface GlobalSearchViewProps {
  query: string;
  setQuery: (val: string) => void;
  type: 'prompt' | 'note';
  setType: (type: 'prompt' | 'note') => void;
  results: GlobalSearchResult[];
  selectedIndex: number;
  updateSelectedIndex: (index: number) => void;
  isLoading: boolean;
  onSelect: (result: GlobalSearchResult) => void;
  onCancel: () => void;
  terminalSize: { columns: number; rows: number };
}

export const GlobalSearchView: React.FC<GlobalSearchViewProps> = ({
  query,
  setQuery,
  type,
  setType,
  results,
  selectedIndex,
  updateSelectedIndex,
  isLoading,
  onSelect,
  onCancel,
  terminalSize,
}) => {
  const { start, end } = useViewport({
    list: results,
    selectedIndex,
    terminalRows: terminalSize.rows - 10, // Account for header and footer
  });

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    } else if (key.return) {
      if (results[selectedIndex]) {
        onSelect(results[selectedIndex]);
      }
    } else if (key.upArrow || input === 'k') {
      updateSelectedIndex(Math.max(0, selectedIndex - 1));
    } else if (key.downArrow || input === 'j') {
      updateSelectedIndex(Math.min(results.length - 1, selectedIndex + 1));
    }
  });

  const items = results.slice(start, end);

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      <Box marginBottom={1} justifyContent="space-between">
        <Text bold color="blue">GLOBAL SEARCH</Text>
        <Box>
          <Text color={type === 'prompt' ? 'cyan' : 'gray'} bold={type === 'prompt'}> [P]rompts </Text>
          <Text color="gray">|</Text>
          <Text color={type === 'note' ? 'cyan' : 'gray'} bold={type === 'note'}> [N]otes </Text>
        </Box>
      </Box>

      <Box borderStyle="round" borderColor="blue" paddingX={1} marginBottom={1}>
        <Box marginRight={1}>
          <Text bold color="blue">QUERY:</Text>
        </Box>
        <UncontrolledSingleLineInput 
          initialValue={query} 
          onChange={(val) => {
            setQuery(val);
            updateSelectedIndex(0);
          }}
          onTab={() => setType(type === 'prompt' ? 'note' : 'prompt')}
          focus={true}
        />
      </Box>

      {isLoading ? (
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Text color="yellow">Searching...</Text>
        </Box>
      ) : results.length === 0 ? (
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Text color="gray">No results found</Text>
        </Box>
      ) : (
        <Box flexDirection="column" flexGrow={1}>
          {items.map((result, index) => {
            const actualIndex = start + index;
            const isSelected = actualIndex === selectedIndex;
            const itemColor = result.type === 'note' ? 'cyan' : (result.name ? 'magenta' : 'yellow');
            
            const firstLine = result.text.split('\n')[0].trim();
            const displayName = result.name || (firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine);

            return (
              <Box key={result.id} flexDirection="column">
                <SelectableRow isSelected={isSelected} isMoving={false}>
                  <Box marginRight={1} flexShrink={0}>
                    <Indicator isSelected={isSelected} isMoving={false} activeColor={itemColor} />
                  </Box>
                  <Box flexShrink={1}>
                    <Text color="gray">[{result.projectName}] </Text>
                    <Text color={itemColor}>{displayName}</Text>
                  </Box>
                </SelectableRow>
                {index < items.length - 1 && (
                  <Divider width={terminalSize.columns - 4} />
                )}
              </Box>
            );
          })}
          <Box flexGrow={1} minHeight={0} />
        </Box>
      )}

      <Box marginTop={1} borderStyle="single" borderTop={true} borderBottom={false} borderLeft={false} borderRight={false} borderColor="gray">
        <Text color="gray">
          [Enter] Edit & Copy | [Tab] Toggle Type | [Esc] Back
        </Text>
      </Box>

    </Box>
  );
};
