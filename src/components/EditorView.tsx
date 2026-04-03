import React, { useState, useRef, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { UncontrolledMultilineInput, UncontrolledMultilineInputRef } from './UncontrolledMultilineInput';
import { fuzzySearchFiles } from '../utils/fileSearch';

export interface EditorViewProps {
  initialText: string;
  onSave: (text: string) => void;
  onCancel: () => void;
  terminalSize: { rows: number; columns: number };
}

export function EditorView({ initialText, onSave, onCancel, terminalSize }: EditorViewProps) {
  const textRef = useRef(initialText);
  const inputRef = useRef<UncontrolledMultilineInputRef>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmOption, setConfirmOption] = useState<'yes' | 'no' | 'cancel'>('yes');

  // Mention State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionEnd, setMentionEnd] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const editorRows = Math.max(5, terminalSize.rows - (mentionQuery !== null ? 12 : 8));

  useEffect(() => {
    if (mentionQuery !== null) {
      const fetchResults = async () => {
        const results = await fuzzySearchFiles(mentionQuery, process.cwd());
        setSearchResults(results);
        setSelectedIndex(0);
      };
      fetchResults();
    } else {
      setSearchResults([]);
      setSelectedIndex(0);
    }
  }, [mentionQuery]);

  const handleConfirmNavigation = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setConfirmOption(prev => {
        if (prev === 'cancel') return 'no';
        if (prev === 'no') return 'yes';
        return 'yes';
      });
    } else {
      setConfirmOption(prev => {
        if (prev === 'yes') return 'no';
        if (prev === 'no') return 'cancel';
        return 'cancel';
      });
    }
  };

  const handleConfirmAction = () => {
    if (confirmOption === 'yes') {
      onSave(textRef.current);
    } else if (confirmOption === 'no') {
      onCancel();
    } else {
      setShowConfirm(false);
    }
  };

  const checkMention = (val: string, cursor: number) => {
    const beforeCursor = val.slice(0, cursor);
    // Regex matches " @" followed by non-space characters at the end of the string
    const match = beforeCursor.match(/(?:^|\s)@([^\s]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionStart(cursor - match[1].length - 1);
      setMentionEnd(cursor);
    } else {
      setMentionQuery(null);
      setMentionStart(null);
      setMentionEnd(null);
    }
  };

  const handleInterceptKey = (input: string | undefined, key: any) => {
    if (mentionQuery !== null) {
      if (key.upArrow) {
        setSelectedIndex(i => Math.max(0, i - 1));
        return true; // Intercept
      }
      if (key.downArrow) {
        setSelectedIndex(i => Math.min(searchResults.length - 1, i + 1));
        return true; // Intercept
      }
      if (key.return || key.tab) {
        // Insert selected file
        if (searchResults[selectedIndex] && mentionStart !== null && mentionEnd !== null) {
          const selectedFile = searchResults[selectedIndex];
          inputRef.current?.insertText("@" + selectedFile + " ", mentionStart, mentionEnd);
        }
        setMentionQuery(null);
        return true; // Intercept
      }
      if (key.escape) {
        setMentionQuery(null);
        return true; // Intercept
      }
    }
    return false;
  };

  useInput((input, key) => {
    if (showConfirm) {
      if (key.leftArrow) {
        handleConfirmNavigation('left');
      } else if (key.rightArrow) {
        handleConfirmNavigation('right');
      } else if (key.return) {
        handleConfirmAction();
      } else if (key.escape) {
        setShowConfirm(false);
      }
      return;
    }

    if (mentionQuery !== null) {
      // Escape is handled by onInterceptKey inside UncontrolledMultilineInput, 
      // but just in case we don't want to trigger the confirm dialog.
      if (key.escape || key.return || key.upArrow || key.downArrow) {
        return;
      }
    }

    if (key.escape) {
      if (textRef.current !== initialText) {
        setShowConfirm(true);
        setConfirmOption('yes');
      } else {
        onCancel();
      }
      return;
    }

    if (key.ctrl && input === 's') {
      onSave(textRef.current);
    }
  });

  // Re-calculate window to ensure exactly 5 items if possible
  let startIdx = 0;
  if (searchResults.length > 5) {
    if (selectedIndex >= searchResults.length - 2) {
      startIdx = searchResults.length - 5;
    } else if (selectedIndex >= 2) {
      startIdx = selectedIndex - 2;
    }
  }
  const windowedResults = searchResults.slice(startIdx, startIdx + 5);

  return (
    <Box flexDirection="column" padding={1} width="100%" height="100%">
      <Box marginBottom={1}>
        <Text bold color="blue">Editor</Text>
      </Box>
      <Box 
        borderStyle="round" 
        paddingX={1} 
        flexDirection="column" 
        borderColor="blue"
        flexGrow={1}
      >
        <UncontrolledMultilineInput
          ref={inputRef}
          initialValue={initialText}
          onChange={(val) => { 
            textRef.current = val;
          }}
          onCursorChange={(cursor) => {
            checkMention(textRef.current, cursor);
          }}
          onInterceptKey={handleInterceptKey}
          rows={editorRows}
          focus={!showConfirm}
        />
      </Box>

      <Box marginTop={1} minHeight={1}>
        {mentionQuery !== null ? (
          <Box flexDirection="column">
            {searchResults.length === 0 ? (
              <Text color="gray">No files found matching "{mentionQuery}"</Text>
            ) : (
              windowedResults.map((result, i) => {
                const actualIndex = startIdx + i;
                const isSelected = actualIndex === selectedIndex;
                return (
                  <Box key={result} backgroundColor={isSelected ? '#334455' : undefined}>
                    <Text color={isSelected ? 'white' : 'gray'}>
                      {isSelected ? '> ' : '  '}{result}
                    </Text>
                  </Box>
                );
              })
            )}
          </Box>
        ) : (
          <Text color="gray">
            [Ctrl+s] Save | [Esc] Cancel
          </Text>
        )}
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
