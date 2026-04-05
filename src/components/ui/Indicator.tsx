import React from 'react';
import { Text } from 'ink';

export interface IndicatorProps {
  isSelected: boolean;
  isMoving?: boolean;
  activeColor?: string;
  inactiveColor?: string;
}

export const Indicator: React.FC<IndicatorProps> = ({
  isSelected,
  isMoving,
  activeColor = 'white',
  inactiveColor = 'gray',
}) => (
  <Text color={isSelected ? activeColor : inactiveColor}>
    {isSelected ? (isMoving ? '↕' : '▶') : ' '}
  </Text>
);
