import React from 'react';
import { Box, Text } from 'ink';

export interface TabItemProps {
  label: string;
  isActive: boolean;
  index?: number;
  activeBackgroundColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  showIndex?: boolean;
}

export const TabItem: React.FC<TabItemProps> = ({
  label,
  isActive,
  index,
  activeBackgroundColor = 'blue',
  activeTextColor = 'black',
  inactiveTextColor = 'gray',
  showIndex = true,
}) => (
  <Box paddingX={1} backgroundColor={isActive ? activeBackgroundColor : undefined}>
    {showIndex && index !== undefined && (
      <Text color={isActive ? activeTextColor : inactiveTextColor}>{index + 1}. </Text>
    )}
    <Text bold={isActive} color={isActive ? activeTextColor : undefined}>
      {label}
    </Text>
  </Box>
);
