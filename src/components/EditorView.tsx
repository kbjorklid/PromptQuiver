import React, { useState, useRef, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { UncontrolledMultilineInput } from './UncontrolledMultilineInput';
import { UncontrolledSingleLineInput } from './UncontrolledSingleLineInput';
import type { UncontrolledMultilineInputRef } from './UncontrolledMultilineInput';
import { useMentionAutocomplete } from '../hooks/useMentionAutocomplete';

export interface EditorViewProps {
  initialText: string;
  initialName?: string;
  isSnippet?: boolean;
  onSave: (text: string, name?: string) => void;
  onCancel: () => void;
  terminalSize: { rows: number; columns: number };
  snippets?: Prompt[];
  canned?: Prompt[];
}

export function EditorView({ 
  initialText, 
  initialName = '', 
  isSnippet = false, 
  onSave, 
  onCancel, 
  terminalSize,
  snippets = [],
  canned = []
}: EditorViewProps) {
  const textRef = useRef(initialText);
  const [name, setName] = useState(initialName);
  const [isEditingName, setIsEditingName] = useState(isSnippet && initialName === '');
  const inputRef = useRef<UncontrolledMultilineInputRef>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmOption, setConfirmOption] = useState<'yes' | 'no' | 'cancel'>('yes');

  const {
    mentionQuery,
    mentionType,
    searchResults,
    selectedIndex,
    checkMention,
    handleInterceptKey,
    closeAutocomplete
  } = useMentionAutocomplete({
    snippets,
    onApply: (textToInsert, start, end) => {
      inputRef.current?.insertText(textToInsert, start, end);
    },
    allowSnippets: !isSnippet
  });

  const nameRegex = /^[a-zA-Z0-9]+([-_][a-zA-Z0-9]+)*$/;
  const isNameValid = !isSnippet || nameRegex.test(name);

  const overhead = mentionQuery !== null 
    ? (isSnippet ? 17 : 12) 
    : (isSnippet ? 15 : 10);
  const editorRows = Math.max(5, terminalSize.rows - overhead);

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
      onSave(textRef.current, isSnippet ? name : undefined);
    } else if (confirmOption === 'no') {
      onCancel();
    } else {
      setShowConfirm(false);
    }
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

    if (isEditingName) {
      if (key.return || key.downArrow || key.tab) {
        if (isNameValid && name.length > 0) {
          setIsEditingName(false);
        }
      } else if (key.escape) {
        if (textRef.current !== initialText || name !== initialName) {
          setShowConfirm(true);
        } else {
          onCancel();
        }
      }
      return;
    }

    if (mentionQuery !== null) {
      if (key.escape || key.return || key.upArrow || key.downArrow) {
        return;
      }
    }

    if (key.escape) {
      if (textRef.current !== initialText || name !== initialName) {
        setShowConfirm(true);
        setConfirmOption('yes');
      } else {
        onCancel();
      }
      return;
    }

    if (key.ctrl && input === 's') {
      if (isNameValid) {
        onSave(textRef.current, isSnippet ? name : undefined);
      }
    }

    if (isSnippet && key.tab && !mentionQuery) {
       setIsEditingName(true);
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
      <Box marginBottom={1} flexDirection="column">
        <Box justifyContent="space-between">
          <Text bold color="blue">Editor {isSnippet ? '(Snippet)' : ''}</Text>
        </Box>
        {isSnippet && (
           <Box flexDirection="column" marginTop={1}>
             <Text color="gray">Name:</Text>
             <Box 
               borderStyle="round" 
               borderColor={isEditingName ? (isNameValid ? 'cyan' : 'red') : 'gray'} 
               paddingX={1} 
               width="100%"
             >
               <UncontrolledSingleLineInput 
                 initialValue={name} 
                 onChange={setName}
                 focus={isEditingName && !showConfirm}
                 placeholder="(empty)"
               />
             </Box>
           </Box>
        )}
      </Box>
      <Box 
        borderStyle="round" 
        paddingX={1} 
        flexDirection="column" 
        borderColor={isEditingName ? 'gray' : 'blue'}
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
          focus={!showConfirm && !isEditingName}
        />
      </Box>

      {mentionQuery === null && (
        <Box paddingX={1} marginBottom={1}>
          <Text color="gray">
            <Text bold color="cyan">@</Text> File{isSnippet ? '' : <Text> | <Text bold color="cyan">$</Text> Snippet (expand) | <Text bold color="cyan">$$</Text> Snippet (var)</Text>}
          </Text>
        </Box>
      )}

      <Box marginTop={1} minHeight={1}>
        {mentionQuery !== null ? (
          <Box flexDirection="column">
            {searchResults.length === 0 ? (
              <Text color="gray">No {mentionType === 'file' ? 'files' : 'snippets'} found matching "{mentionQuery}"</Text>
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
          <Box justifyContent="space-between" width="100%">
            <Text color="gray">
              [Ctrl+s] Save | [Esc] Cancel {isSnippet ? '| [Tab] Edit Name' : ''}
            </Text>
            {isSnippet && !isNameValid && (
              <Text color="red">Invalid name! (use a-z, 0-9, -, _)</Text>
            )}
          </Box>
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
