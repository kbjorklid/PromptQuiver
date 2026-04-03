import React, { useState, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { UncontrolledTextInput } from 'ink-text-input';
import { UncontrolledMultilineInput } from './UncontrolledMultilineInput';

export interface EditorViewProps {
  initialText: string;
  onSave: (text: string) => void;
  onCancel: () => void;
  terminalSize: { rows: number; columns: number };
}

export function EditorView({ initialText, onSave, onCancel, terminalSize }: EditorViewProps) {
  const [useSingleLine, setUseSingleLine] = useState(false);
  const textRef = useRef(initialText);

  const editorRows = Math.max(5, terminalSize.rows - 8);

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    }
    if (key.ctrl && input === 'd') {
      setUseSingleLine(prev => !prev);
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
        {useSingleLine ? (
          <UncontrolledMultilineInput
            initialValue={initialText}
            onChange={(val) => { textRef.current = val; }}
            rows={1}
            maxRows={1}
            focus={true}
          />
        ) : (
          <UncontrolledMultilineInput
            initialValue={initialText}
            onChange={(val) => { textRef.current = val; }}
            rows={editorRows}
            focus={true}
          />
        )}
      </Box>
      <Box marginTop={1}>
        <Text color="gray">
          [Ctrl+s] Save | [Esc] Cancel | [Ctrl+d] Toggle Single/Multi
        </Text>
      </Box>
    </Box>
  );
}
