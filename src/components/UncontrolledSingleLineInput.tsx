import React, { useState, useRef, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

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

export interface UncontrolledSingleLineInputProps {
  initialValue: string;
  onChange?: (value: string) => void;
  onEnter?: () => void;
  onTab?: () => void;
  onEscape?: () => void;
  onDownArrow?: () => void;
  focus?: boolean;
  placeholder?: string;
  color?: string;
}

export function UncontrolledSingleLineInput({
  initialValue,
  onChange,
  onEnter,
  onTab,
  onEscape,
  onDownArrow,
  focus = true,
  placeholder = '',
  color
}: UncontrolledSingleLineInputProps) {
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
    let cursorChanged = false;

    if (key.leftArrow) {
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
      if (newCursor > 0) {
        newValue = newValue.slice(0, newCursor - 1) + newValue.slice(newCursor);
        newCursor--;
        changed = true;
        cursorChanged = true;
      }
    } else if (key.return) {
      onEnter?.();
    } else if (key.tab) {
      onTab?.();
    } else if (key.escape) {
      onEscape?.();
    } else if (key.downArrow) {
      onDownArrow?.();
    } else if (input && !key.ctrl && !key.meta) {
      // Don't allow newlines in single line input
      const normalizedInput = input.replace(/\r\n/g, "").replace(/\r/g, "").replace(/\n/g, "");
      if (normalizedInput.length > 0) {
        newValue = newValue.slice(0, newCursor) + normalizedInput + newValue.slice(newCursor);
        newCursor += normalizedInput.length;
        changed = true;
        cursorChanged = true;
      }
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
    }
  }, { isActive: focus });

  const renderValue = () => {
    if (!focus) {
      return value || placeholder;
    }

    const text = value;
    if (text.length === 0) {
      return '\x1b[7m \x1b[27m';
    }

    let result = '';
    for (let i = 0; i < text.length; i++) {
      if (i === cursorIndex) {
        result += `\x1b[7m${text[i]}\x1b[27m`;
      } else {
        result += text[i];
      }
    }

    if (cursorIndex === text.length) {
      result += '\x1b[7m \x1b[27m';
    }

    return result;
  };

  return (
    <Box>
      <Text color={color}>{renderValue()}</Text>
    </Box>
  );
}
