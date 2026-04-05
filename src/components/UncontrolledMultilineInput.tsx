import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Box, Text, useInput } from 'ink';

function normalizeLineEndings(text: string): string {
  if (text == null) return "";
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function moveCursorWordLeft(text: string, cursor: number): number {
  if (cursor === 0) return 0;
  let newCursor = cursor;

  // Skip whitespace to the left
  while (newCursor > 0 && /\s/.test(text[newCursor - 1])) {
    newCursor--;
  }

  if (newCursor === 0) return 0;

  const isAlphanumeric = /[\w]/.test(text[newCursor - 1]);
  if (isAlphanumeric) {
    while (newCursor > 0 && /[\w]/.test(text[newCursor - 1])) {
      newCursor--;
    }
  } else {
    while (newCursor > 0 && !/[\w]/.test(text[newCursor - 1]) && !/\s/.test(text[newCursor - 1])) {
      newCursor--;
    }
  }

  return newCursor;
}

function moveCursorWordRight(text: string, cursor: number): number {
  if (cursor >= text.length) return text.length;
  let newCursor = cursor;

  // Skip whitespace to the right
  while (newCursor < text.length && /\s/.test(text[newCursor])) {
    newCursor++;
  }

  if (newCursor >= text.length) return text.length;

  const isAlphanumeric = /[\w]/.test(text[newCursor]);
  if (isAlphanumeric) {
    while (newCursor < text.length && /[\w]/.test(text[newCursor])) {
      newCursor++;
    }
  } else {
    while (newCursor < text.length && !/[\w]/.test(text[newCursor]) && !/\s/.test(text[newCursor])) {
      newCursor++;
    }
  }

  return newCursor;
}

export interface UncontrolledMultilineInputProps {
  initialValue: string;
  onChange?: (value: string) => void;
  onCursorChange?: (cursor: number) => void;
  onInterceptKey?: (input: string | undefined, key: any) => boolean;
  rows?: number;
  width?: number;
  focus?: boolean;
}

export interface UncontrolledMultilineInputRef {
  insertText: (text: string, start: number, end: number) => void;
}

export const UncontrolledMultilineInput = forwardRef<UncontrolledMultilineInputRef, UncontrolledMultilineInputProps>(({
  initialValue,
  onChange,
  onCursorChange,
  onInterceptKey,
  rows,
  width,
  focus = true
}, ref) => {
  const [value, setValue] = useState(initialValue);
  const valueRef = useRef(initialValue);
  const [cursorIndex, setCursorIndex] = useState(initialValue.length);
  const cursorRef = useRef(initialValue.length);

  useImperativeHandle(ref, () => ({
    insertText: (text: string, start: number, end: number) => {
      const currentVal = valueRef.current;
      const before = currentVal.slice(0, start);
      const after = currentVal.slice(end);
      const newVal = before + text + after;
      const newCursor = start + text.length;

      valueRef.current = newVal;
      cursorRef.current = newCursor;
      setValue(newVal);
      setCursorIndex(newCursor);
      onChange?.(newVal);
      onCursorChange?.(newCursor);
    }
  }));

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    cursorRef.current = cursorIndex;
  }, [cursorIndex]);

  useInput((input, key) => {
    if (!focus) return;
    if (onInterceptKey?.(input, key)) return;

    let newValue = valueRef.current;
    let newCursor = cursorRef.current;
    let changed = false;
    let cursorChanged = false;

    if (key.upArrow) {
      const lines = normalizeLineEndings(newValue).split("\n");
      let currentLineIndex = 0;
      let currentPos = 0;
      let col = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined) continue;
        const lineLen = line.length;
        const lineEnd = currentPos + lineLen;
        if (newCursor >= currentPos && newCursor <= lineEnd) {
          currentLineIndex = i;
          col = newCursor - currentPos;
          break;
        }
        currentPos = lineEnd + 1;
      }
      if (currentLineIndex > 0) {
        const targetLineIndex = currentLineIndex - 1;
        const targetLine = lines[targetLineIndex];
        if (targetLine !== undefined) {
          const targetLineLen = targetLine.length;
          const newCol = Math.min(col, targetLineLen);
          let newIdx = 0;
          for (let i = 0; i < targetLineIndex; i++) {
            const l = lines[i];
            if (l !== undefined) {
              newIdx += l.length + 1;
            }
          }
          newIdx += newCol;
          newCursor = newIdx;
          cursorChanged = true;
        }
      }
    } else if (key.downArrow) {
      const lines = normalizeLineEndings(newValue).split("\n");
      let currentLineIndex = 0;
      let currentPos = 0;
      let col = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined) continue;
        const lineLen = line.length;
        const lineEnd = currentPos + lineLen;
        if (newCursor >= currentPos && newCursor <= lineEnd) {
          currentLineIndex = i;
          col = newCursor - currentPos;
          break;
        }
        currentPos = lineEnd + 1;
      }
      if (currentLineIndex < lines.length - 1) {
        const targetLineIndex = currentLineIndex + 1;
        const targetLine = lines[targetLineIndex];
        if (targetLine !== undefined) {
          const targetLineLen = targetLine.length;
          const newCol = Math.min(col, targetLineLen);
          let newIdx = 0;
          for (let i = 0; i < targetLineIndex; i++) {
            const l = lines[i];
            if (l !== undefined) {
              newIdx += l.length + 1;
            }
          }
          newIdx += newCol;
          newCursor = newIdx;
          cursorChanged = true;
        }
      }
    } else if (key.leftArrow) {
      if (key.ctrl) {
        newCursor = moveCursorWordLeft(newValue, newCursor);
        cursorChanged = true;
      } else if (newCursor > 0) {
        newCursor = Math.max(0, newCursor - 1);
        cursorChanged = true;
      }
    } else if (key.rightArrow) {
      if (key.ctrl) {
        newCursor = moveCursorWordRight(newValue, newCursor);
        cursorChanged = true;
      } else if (newCursor < newValue.length) {
        newCursor = Math.min(newValue.length, newCursor + 1);
        cursorChanged = true;
      }
    } else if (key.backspace || key.delete) {
      // Map BOTH to backward delete to fix issues on Windows where Backspace acts as Delete
      if (newCursor > 0) {
        newValue = newValue.slice(0, newCursor - 1) + newValue.slice(newCursor);
        newCursor--;
        changed = true;
        cursorChanged = true;
      }
    } else if (key.return) {
      newValue = newValue.slice(0, newCursor) + "\n" + newValue.slice(newCursor);
      newCursor++;
      changed = true;
      cursorChanged = true;
    } else if (input && !key.ctrl && !key.meta && !key.escape && !key.tab) {
      // Normalize \r or \r\n to \n
      const normalizedInput = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      newValue = newValue.slice(0, newCursor) + normalizedInput + newValue.slice(newCursor);
      newCursor += normalizedInput.length;
      changed = true;
      cursorChanged = true;
    }

    if (changed || cursorChanged) {
      if (changed) {
        valueRef.current = newValue;
        setValue(newValue);
      }
      if (cursorChanged) {
        cursorRef.current = newCursor;
        setCursorIndex(newCursor);
      }
      if (changed) {
        onChange?.(newValue);
      }
      onCursorChange?.(newCursor);
    }
  }, { isActive: focus });

  const renderValue = () => {
    if (!focus) {
      return value;
    }

    const text = value;
    if (text.length === 0) {
      return '\x1b[7m \x1b[27m';
    }

    let result = '';
    for (let i = 0; i < text.length; i++) {
      if (i === cursorIndex) {
        if (text[i] === '\n') {
          result += '\x1b[7m \x1b[27m\n';
        } else {
          result += `\x1b[7m${text[i]}\x1b[27m`;
        }
      } else {
        result += text[i];
      }
    }

    if (cursorIndex === text.length) {
      result += '\x1b[7m \x1b[27m';
    }

    return result;
  };

  const lines = value.split('\n');
  let currentLineIndex = 0;
  let currentPos = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;
    const lineEnd = currentPos + line.length;
    if (cursorIndex >= currentPos && cursorIndex <= lineEnd) {
      currentLineIndex = i;
      break;
    }
    currentPos = lineEnd + 1;
  }

  const visibleRows = rows || 1;
  let startLine = 0;
  
  if (lines.length > visibleRows) {
    if (currentLineIndex >= visibleRows) {
      startLine = currentLineIndex - visibleRows + 1;
    }
  }

  const visibleTextLines = renderValue().split('\n').slice(startLine, startLine + visibleRows);

  return (
    <Box flexDirection="column" height={visibleRows} width={width} overflow="hidden">
      {visibleTextLines.map((line, idx) => (
        <Text key={idx}>{line === '' ? ' ' : line}</Text>
      ))}
    </Box>
  );
});
