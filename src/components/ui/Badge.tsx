import React from 'react';
import { Text } from 'ink';

export interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  bold?: boolean;
  dim?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ children, color, bold, dim }) => (
  <Text color={color} bold={bold} dimColor={dim}>
    {children}
  </Text>
);
