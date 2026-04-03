import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface SearchInputProps {
  isSearching: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  updateSelectedIndex: (index: number) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  isSearching,
  searchQuery,
  setSearchQuery,
  updateSelectedIndex,
}) => {
  if (isSearching) {
    return (
      <Box paddingX={1} marginTop={1}>
        <Text color="blue">/</Text>
        <TextInput 
          value={searchQuery} 
          onChange={(val) => {
            setSearchQuery(val);
            updateSelectedIndex(0);
          }} 
        />
      </Box>
    );
  }

  if (searchQuery) {
    return (
      <Box paddingX={1} marginTop={1}>
        <Text color="gray">Filter: </Text>
        <Text color="blue">{searchQuery}</Text>
        <Text color="gray"> (press / to edit, Esc to clear)</Text>
      </Box>
    );
  }

  return null;
};
