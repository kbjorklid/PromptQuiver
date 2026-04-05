import React from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import type { Tab } from '../hooks/usePrompts';
import { TabItem } from './ui/TabItem';

interface HeaderProps {
  activeTab: Tab;
  orderedTabs: Tab[];
  terminalSize?: { columns: number; rows: number };
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  orderedTabs, 
  terminalSize 
}) => {
  const title = " PROMPT QUIVER ";
  const tail = "≫≫≫";
  const head = "➤";
  const columns = terminalSize?.columns || 80;
  
  // Account for margin and some safety padding
  const reservedWidth = 2;
  const availableForArrow = columns - reservedWidth - title.length - tail.length - head.length;
  const arrowWidth = Math.max(0, Math.floor(availableForArrow / 2));
  
  const shaft = "━".repeat(arrowWidth);
  const arrowArt = `${tail}${shaft}${title}${shaft}${head}`;

  return (
    <Box marginBottom={1} flexDirection="column">
      <Box justifyContent="space-between" alignItems="center">
        <Box flexShrink={1}>
          <Gradient name="atlas">
            <Text bold italic wrap="truncate-end">{arrowArt}</Text>
          </Gradient>
        </Box>
      </Box>
      <Box marginTop={1}>
        {orderedTabs.map((t, i) => (
          <React.Fragment key={t}>
            <TabItem
              label={t === 'main' ? 'Prompt' : t.charAt(0).toUpperCase() + t.slice(1)}
              isActive={activeTab === t}
              index={i}
            />
            {i < orderedTabs.length - 1 && <Text color="gray"> | </Text>}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
};
