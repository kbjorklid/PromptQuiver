import React, { useState, useRef, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

function normalizeLineEndings(text: string): string {
  if (text == null) return "";
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export interface UncontrolledMultilineInputProps {
  initialValue: string;
  onChange?: (value: string) => void;
  rows?: number;
  width?: number;
  focus?: boolean;
}

export function UncontrolledMultilineInput({
  initialValue,
  onChange,
  rows,
  width,
  focus = true
}: UncontrolledMultilineInputProps) {
  const [value, setValue] = useState(initialValue);
  const valueRef = useRef(initialValue);
  const [cursorIndex, setCursorIndex] = useState(initialValue.length);
  const cursorRef = useRef(initialValue.length);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    cursorRef.current = cursorIndex;
  }, [cursorIndex]);

  useInput((input, key) => {
    if (!focus) return;

    let newValue = valueRef.current;
    let newCursor = cursorRef.current;
    let changed = false;

    if (key.upArrow) {
      const lines = normalizeLineEndings(newValue).split("\n");
      let currentLineIndex = 0;
      let currentPos = 0;
      let col = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
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
        const targetLineLen = targetLine.length;
        const newCol = Math.min(col, targetLineLen);
        let newIdx = 0;
        for (let i = 0; i < targetLineIndex; i++) {
          newIdx += lines[i].length + 1;
        }
        newIdx += newCol;
        newCursor = newIdx;
        changed = true;
      }
    } else if (key.downArrow) {
      const lines = normalizeLineEndings(newValue).split("\n");
      let currentLineIndex = 0;
      let currentPos = 0;
      let col = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
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
        const targetLineLen = targetLine.length;
        const newCol = Math.min(col, targetLineLen);
        let newIdx = 0;
        for (let i = 0; i < targetLineIndex; i++) {
          newIdx += lines[i].length + 1;
        }
        newIdx += newCol;
        newCursor = newIdx;
        changed = true;
      }
    } else if (key.leftArrow) {
      newCursor = Math.max(0, newCursor - 1);
      changed = true;
    } else if (key.rightArrow) {
      newCursor = Math.min(newValue.length, newCursor + 1);
      changed = true;
    } else if (key.backspace || key.delete) {
      // Map BOTH to backward delete to fix issues on Windows where Backspace acts as Delete
      if (newCursor > 0) {
        newValue = newValue.slice(0, newCursor - 1) + newValue.slice(newCursor);
        newCursor--;
        changed = true;
      }
    } else if (key.return) {
      newValue = newValue.slice(0, newCursor) + "\n" + newValue.slice(newCursor);
      newCursor++;
      changed = true;
    } else if (input && !key.ctrl && !key.meta && !key.escape && !key.tab) {
      // Normalize \r or \r\n to \n
      const normalizedInput = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      newValue = newValue.slice(0, newCursor) + normalizedInput + newValue.slice(newCursor);
      newCursor += normalizedInput.length;
      changed = true;
    }

    if (changed) {
      valueRef.current = newValue;
      cursorRef.current = newCursor;
      setValue(newValue);
      setCursorIndex(newCursor);
      onChange?.(newValue);
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
    const lineEnd = currentPos + lines[i].length;
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
}
