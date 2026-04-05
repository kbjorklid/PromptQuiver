import React, { useState, useRef, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

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
      if (newCursor > 0) {
        newCursor = Math.max(0, newCursor - 1);
        cursorChanged = true;
      }
    } else if (key.rightArrow) {
      if (newCursor < newValue.length) {
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
