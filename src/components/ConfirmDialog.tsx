import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface ConfirmOption<T> {
  label: string;
  value: T;
}

export interface ConfirmDialogProps<T> {
  title: string;
  message?: string;
  options: ConfirmOption<T>[];
  onSelect: (value: T) => void;
  onCancel?: () => void;
  terminalSize: { columns: number; rows: number };
  focus?: boolean;
}

export function ConfirmDialog<T>({ 
  title, 
  message,
  options, 
  onSelect, 
  onCancel,
  terminalSize,
  focus = true
}: ConfirmDialogProps<T>) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.leftArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.rightArrow) {
      setSelectedIndex(prev => Math.min(options.length - 1, prev + 1));
    } else if (key.return) {
      onSelect(options[selectedIndex].value);
    } else if (key.escape && onCancel) {
      onCancel();
    }
  }, { isActive: focus });

  return (
    <Box 
      position="absolute" 
      width={terminalSize.columns - 2} 
      height={terminalSize.rows - 2}
      alignItems="center"
      justifyContent="center"
    >
      <Box 
        flexDirection="column" 
        borderStyle="double" 
        borderColor="yellow" 
        paddingX={2} 
        paddingY={1}
        backgroundColor="black"
      >
        <Box justifyContent="center" flexDirection="column" alignItems="center">
          <Text bold>{title}</Text>
          {message && <Box marginTop={1}><Text>{message}</Text></Box>}
        </Box>
        <Box marginTop={1} justifyContent="center">
          {options.map((option, index) => {
            const isSelected = index === selectedIndex;
            return (
              <Box 
                key={index} 
                paddingX={1} 
                backgroundColor={isSelected ? 'blue' : undefined}
                marginLeft={index > 0 ? 1 : 0}
              >
                <Text color={isSelected ? 'white' : undefined}>
                  {option.label}
                </Text>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
