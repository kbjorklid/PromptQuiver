import React from 'react';
import { Box, Text } from 'ink';

export interface SectionTitleProps {
  children: React.ReactNode;
  marginTop?: number;
  marginBottom?: number;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  children,
  marginTop = 1,
  marginBottom = 0,
}) => (
  <Box marginTop={marginTop} marginBottom={marginBottom}>
    <Text bold underline>
      {children}
    </Text>
  </Box>
);
