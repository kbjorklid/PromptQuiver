import React, { useState, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { UncontrolledMultilineInput } from './UncontrolledMultilineInput';

export interface EditorViewProps {
  initialText: string;
  onSave: (text: string) => void;
  onCancel: () => void;
  terminalSize: { rows: number; columns: number };
}

export function EditorView({ initialText, onSave, onCancel, terminalSize }: EditorViewProps) {
  const textRef = useRef(initialText);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmOption, setConfirmOption] = useState<'yes' | 'no' | 'cancel'>('yes');

  const editorRows = Math.max(5, terminalSize.rows - 8);

  useInput((input, key) => {
    if (showConfirm) {
      if (key.leftArrow) {
        setConfirmOption(prev => {
          if (prev === 'cancel') return 'no';
          if (prev === 'no') return 'yes';
          return 'yes';
        });
      }
      if (key.rightArrow) {
        setConfirmOption(prev => {
          if (prev === 'yes') return 'no';
          if (prev === 'no') return 'cancel';
          return 'cancel';
        });
      }
      if (key.return) {
        if (confirmOption === 'yes') {
          onSave(textRef.current);
        } else if (confirmOption === 'no') {
          onCancel();
        } else {
          setShowConfirm(false);
        }
      }
      if (key.escape) {
        setShowConfirm(false);
      }
      return;
    }

    if (key.escape) {
      if (textRef.current !== initialText) {
        setShowConfirm(true);
        setConfirmOption('yes');
      } else {
        onCancel();
      }
    }
    if (key.ctrl && input === 's') {
      onSave(textRef.current);
    }
  });

  return (
    <Box flexDirection="column" padding={1} width="100%">
      <Box marginBottom={1}>
        <Text bold color="blue">Editor</Text>
      </Box>
      <Box 
        borderStyle="round" 
        paddingX={1} 
        flexDirection="column" 
        borderColor="blue"
      >
        <UncontrolledMultilineInput
          initialValue={initialText}
          onChange={(val) => { textRef.current = val; }}
          rows={editorRows}
          focus={!showConfirm}
        />
      </Box>

      <Box marginTop={1}>
        <Text color="gray">
          [Ctrl+s] Save | [Esc] Cancel
        </Text>
      </Box>

      {showConfirm && (
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
            <Box justifyContent="center">
              <Text bold>Save changes?</Text>
            </Box>
            <Box marginTop={1} justifyContent="center">
              <Box paddingX={1} backgroundColor={confirmOption === 'yes' ? 'blue' : undefined}>
                <Text color={confirmOption === 'yes' ? 'white' : undefined}> Yes </Text>
              </Box>
              <Box paddingX={1} backgroundColor={confirmOption === 'no' ? 'blue' : undefined}>
                <Text color={confirmOption === 'no' ? 'white' : undefined}> No </Text>
              </Box>
              <Box paddingX={1} backgroundColor={confirmOption === 'cancel' ? 'blue' : undefined}>
                <Text color={confirmOption === 'cancel' ? 'white' : undefined}> Cancel </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
