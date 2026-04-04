import React, { useState, useRef, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { UncontrolledMultilineInput } from './UncontrolledMultilineInput';
import type { UncontrolledMultilineInputRef } from './UncontrolledMultilineInput';
import { fuzzySearchFiles } from '../utils/fileSearch';
import type { Prompt } from '../storage/paths';

export interface EditorViewProps {
  initialText: string;
  initialName?: string;
  isSnippet?: boolean;
  onSave: (text: string, name?: string) => void;
  onCancel: () => void;
  terminalSize: { rows: number; columns: number };
  snippets?: Prompt[];
}

export function EditorView({ 
  initialText, 
  initialName = '', 
  isSnippet = false, 
  onSave, 
  onCancel, 
  terminalSize,
  snippets = []
}: EditorViewProps) {
  const textRef = useRef(initialText);
  const [name, setName] = useState(initialName);
  const [isEditingName, setIsEditingName] = useState(isSnippet && initialName === '');
  const inputRef = useRef<UncontrolledMultilineInputRef>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmOption, setConfirmOption] = useState<'yes' | 'no' | 'cancel'>('yes');

  // Mention State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionType, setMentionType] = useState<'file' | 'snippet' | null>(null);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionEnd, setMentionEnd] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const nameRegex = /^[a-zA-Z0-9]+([-_][a-zA-Z0-9]+)*$/;
  const isNameValid = !isSnippet || nameRegex.test(name);

  const editorRows = Math.max(5, terminalSize.rows - (mentionQuery !== null ? 12 : (isSnippet ? 10 : 8)));

  const prevMentionQuery = useRef<string | null>(null);
  const prevMentionType = useRef<'file' | 'snippet' | null>(null);

  useEffect(() => {
    if (mentionQuery !== null) {
      const fetchResults = async () => {
        if (mentionType === 'file') {
          const results = await fuzzySearchFiles(mentionQuery, process.cwd());
          setSearchResults(results);
        } else if (mentionType === 'snippet') {
          const results = snippets
            .filter(s => s.name?.toLowerCase().includes(mentionQuery.toLowerCase()))
            .map(s => s.name!)
            .sort();
          setSearchResults(results);
        }
        
        if (mentionQuery !== prevMentionQuery.current || mentionType !== prevMentionType.current) {
          setSelectedIndex(0);
          prevMentionQuery.current = mentionQuery;
          prevMentionType.current = mentionType;
        }
      };
      fetchResults();
    } else {
      setSearchResults([]);
      setSelectedIndex(0);
      prevMentionQuery.current = null;
      prevMentionType.current = null;
    }
  }, [mentionQuery, mentionType, snippets]);

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

  const checkMention = (val: string, cursor: number) => {
    const beforeCursor = val.slice(0, cursor);
    const fileMatch = beforeCursor.match(/(?:^|\s)@([^\s]*)$/);
    const snippetMatch = beforeCursor.match(/(?:^|\s)\$\$([^\s]*)$/);

    if (fileMatch && fileMatch[1] !== undefined) {
      setMentionType('file');
      setMentionQuery(fileMatch[1]);
      setMentionStart(cursor - fileMatch[1].length - 1);
      setMentionEnd(cursor);
    } else if (snippetMatch && snippetMatch[1] !== undefined) {
      setMentionType('snippet');
      setMentionQuery(snippetMatch[1]);
      setMentionStart(cursor - snippetMatch[1].length - 2);
      setMentionEnd(cursor);
    } else {
      setMentionType(null);
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
        if (searchResults[selectedIndex] && mentionStart !== null && mentionEnd !== null) {
          const result = searchResults[selectedIndex];
          if (mentionType === 'file') {
            inputRef.current?.insertText("@" + result + " ", mentionStart, mentionEnd);
          } else if (mentionType === 'snippet') {
            inputRef.current?.insertText("$$" + result + " ", mentionStart, mentionEnd);
          }
        }
        setMentionQuery(null);
        setMentionType(null);
        return true; // Intercept
      }
      if (key.escape) {
        setMentionQuery(null);
        setMentionType(null);
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
             {isEditingName ? (
               <Box borderStyle="single" borderColor={isNameValid ? 'cyan' : 'red'} paddingX={1} width="100%">
                 <TextInput 
                   value={name} 
                   onChange={setName} 
                 />
               </Box>
             ) : (
               <Box paddingX={1}>
                 <Text color={isNameValid ? 'cyan' : 'red'} bold>{name || '(empty)'}</Text>
               </Box>
             )}
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
