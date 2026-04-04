import React from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import type { Tab } from '../hooks/usePrompts';

interface HeaderProps {
  activeTab: Tab;
  orderedTabs: Tab[];
  branchFilterEnabled?: boolean;
  currentBranch?: string;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, orderedTabs, branchFilterEnabled, currentBranch }) => {
  return (
    <Box marginBottom={1} flexDirection="column">
      <Box justifyContent="space-between" alignItems="center">
        <Gradient name="atlas">
          <Text bold italic>{">>> PROMPTCUE <<<"}</Text>
        </Gradient>
        {branchFilterEnabled && currentBranch && (
          <Text color="cyan">Branch: {currentBranch}</Text>
        )}
      </Box>
      <Box marginTop={1}>
        {orderedTabs.map((t, i) => (
          <React.Fragment key={t}>
            <Box paddingX={1} backgroundColor={activeTab === t ? 'blue' : undefined}>
              <Text color={activeTab === t ? 'black' : 'gray'}>{i + 1}. </Text>
              <Text bold={activeTab === t} color={activeTab === t ? 'black' : undefined}>
                {t === 'main' ? 'Prompt' : t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </Box>
            {i < orderedTabs.length - 1 && <Text color="gray"> | </Text>}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
};
