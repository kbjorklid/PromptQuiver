import React from 'react';
import { Box, Text } from 'ink';

export interface SelectableRowProps {
  isSelected: boolean;
  isMoving?: boolean;
  children: React.ReactNode;
  activeBackgroundColor?: string;
  movingBackgroundColor?: string;
  paddingX?: number;
}

export const SelectableRow: React.FC<SelectableRowProps> = ({
  isSelected,
  isMoving,
  children,
  activeBackgroundColor = '#334455',
  movingBackgroundColor = '#445566',
  paddingX = 1,
}) => {
  let backgroundColor: string | undefined = undefined;
  if (isSelected) {
    backgroundColor = isMoving ? movingBackgroundColor : activeBackgroundColor;
  }

  return (
    <Box paddingX={paddingX} backgroundColor={backgroundColor}>
      {children}
    </Box>
  );
};
