import React from 'react';
import { Text } from 'ink';

export interface DividerProps {
  char?: string;
  color?: string;
  width?: number;
}

export const Divider: React.FC<DividerProps> = ({ char = '─', color = 'gray', width = 80 }) => (
  <Text color={color} wrap="truncate-end">
    {char.repeat(width)}
  </Text>
);
