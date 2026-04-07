import React, { useState, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Prompt } from '../storage';
import { UncontrolledMultilineInput } from './UncontrolledMultilineInput';
import { UncontrolledSingleLineInput } from './UncontrolledSingleLineInput';
import type { UncontrolledMultilineInputRef } from './UncontrolledMultilineInput';
import { useMentionAutocomplete } from '../hooks/useMentionAutocomplete';
import type { MentionType } from '../hooks/useMentionAutocomplete';
import { ConfirmDialog } from './ConfirmDialog';

export interface EditorViewProps {
  initialText: string;
  initialName?: string;
  isSnippet?: boolean;
  canStage?: boolean;
  readOnly?: boolean;
  onSave: (text: string, name?: string, shouldStage?: boolean) => void;
  onCancel: () => void;
  terminalSize: { rows: number; columns: number };
  snippets?: Prompt[];
  canned?: Prompt[];
  slashCommands?: string[];
}

type ConfirmOption = 'yes' | 'no' | 'cancel';

export function EditorView({ 
  initialText, 
  initialName = '', 
  isSnippet = false, 
  canStage = false,
  readOnly = false,
  onSave, 
  onCancel, 
  terminalSize,
  snippets = [],
  canned = [],
  slashCommands = []
}: EditorViewProps) {
  const textRef = useRef(initialText);
  const [name, setName] = useState(initialName);
  const [isEditingName, setIsEditingName] = useState(isSnippet && initialName === '');
  const inputRef = useRef<UncontrolledMultilineInputRef>(null);

  const [showConfirm, setShowConfirm] = useState(false);

  const {
    mentionQuery,
    mentionType,
    searchResults,
    selectedIndex,
    checkMention,
    handleInterceptKey,
  } = useMentionAutocomplete({
    snippets,
    slashCommands,
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

  const handleConfirmAction = (option: ConfirmOption) => {
    if (option === 'yes') {
      onSave(textRef.current, isSnippet ? name : undefined);
    } else if (option === 'no') {
      onCancel();
    } else {
      setShowConfirm(false);
    }
  };

  useInput((input, key) => {
    if (showConfirm) return;

    if (readOnly) {
      if (key.escape) {
        onCancel();
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
      } else {
        onCancel();
      }
      return;
    }

    const isS = input.toLowerCase() === 's' || input === '\u0013';
    if (key.ctrl && isS) {
      if (isNameValid) {
        onSave(textRef.current, isSnippet ? name : undefined, false);
      }
    }

    if (key.ctrl && (input.toLowerCase() === 'g' || input === '\u0007')) {
      if (isNameValid && canStage) {
        onSave(textRef.current, isSnippet ? name : undefined, true);
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

  const getMentionTypeName = (type: MentionType | null) => {
    switch (type) {
      case 'file': return 'files';
      case 'snippet-expand':
      case 'snippet-var': return 'snippets';
      case 'slash-command': return 'slash commands';
      default: return 'items';
    }
  };

  return (
    <Box flexDirection="column" padding={1} width="100%" height="100%">
      <Box marginBottom={1} flexDirection="column">
        <Box justifyContent="space-between">
          <Text bold color="blue">{readOnly ? 'Viewer' : 'Editor'} {isSnippet ? '(Snippet)' : ''}</Text>
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
          readOnly={readOnly}
        />
      </Box>

      {!readOnly && mentionQuery === null && (
        <Box paddingX={1} marginBottom={1} flexDirection="column">
          <Text color="gray">
            <Text bold color="cyan">@</Text> File{isSnippet ? '' : <Text> | <Text bold color="cyan">$</Text> Snippet (expand) | <Text bold color="cyan">$$</Text> Snippet (var)</Text>} | <Text bold color="cyan">/</Text> Slash Command
          </Text>
          <Text color="gray">
            <Text bold color="cyan">--</Text> Comment (ignored on copy)
          </Text>
        </Box>
      )}

      <Box marginTop={1} minHeight={1}>
        {readOnly ? (
          <Box justifyContent="space-between" width="100%">
            <Text color="gray">[Esc] Back</Text>
          </Box>
        ) : mentionQuery !== null ? (
          <Box flexDirection="column">
            {searchResults.length === 0 ? (
              <Text color="gray">No {getMentionTypeName(mentionType)} found matching "{mentionQuery}"</Text>
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
              [Ctrl+s] Save {canStage ? '| [Ctrl+g] Save & Stage ' : ''}| [Esc] Cancel {isSnippet ? '| [Tab] Edit Name' : ''}
            </Text>
            {isSnippet && !isNameValid && (
              <Text color="red">Invalid name! (use a-z, 0-9, -, _)</Text>
            )}
          </Box>
        )}
      </Box>

      {showConfirm && (
        <ConfirmDialog
          title="Save changes?"
          options={[
            { label: ' Yes ', value: 'yes' },
            { label: ' No ', value: 'no' },
            { label: ' Cancel ', value: 'cancel' }
          ]}
          onSelect={handleConfirmAction}
          onCancel={() => setShowConfirm(false)}
          terminalSize={terminalSize}
        />
      )}
    </Box>
  );
}
