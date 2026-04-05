import React from 'react';
import { Box, Text } from 'ink';

export interface StatusItemProps {
  label?: string;
  value: string | number;
  color: string;
  bold?: boolean;
  showLabel?: boolean;
}

export const StatusItem: React.FC<StatusItemProps> = ({
  label,
  value,
  color,
  bold,
  showLabel = true,
}) => (
  <Box marginRight={2}>
    {showLabel && label && (
      <Text color="white" dimColor>
        {label}
      </Text>
    )}
    <Text color={color} bold={bold}>
      {value}
    </Text>
  </Box>
);
