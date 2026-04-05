import React from 'react';
import { render } from 'ink-testing-library';
import { UncontrolledMultilineInput } from '../components/UncontrolledMultilineInput';
import { expect, test, describe, vi } from 'bun:test';

// Helper to strip ANSI codes for easier assertion
const stripAnsi = (str: string) => str.replace(/\u001b\[[0-9;]*m/g, '');

describe('UncontrolledMultilineInput', () => {
  test('renders initial value and handles basic typing', async () => {
    const onChange = vi.fn();
    const { stdin, lastFrame } = render(
      <UncontrolledMultilineInput initialValue="Hello" onChange={onChange} />
    );

    expect(stripAnsi(lastFrame() || '').includes('Hello')).toBe(true);

    stdin.write(' World');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(onChange).toHaveBeenCalledWith('Hello World');
    expect(stripAnsi(lastFrame() || '').includes('Hello World')).toBe(true);
  });

  test('handles backspace', async () => {
    const onChange = vi.fn();
    const { stdin, lastFrame } = render(
      <UncontrolledMultilineInput initialValue="ABC" onChange={onChange} />
    );

    stdin.write('\b'); // Backspace
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(onChange).toHaveBeenCalledWith('AB');
    expect(stripAnsi(lastFrame() || '').includes('AB')).toBe(true);
  });

  test('handles return key (multiline)', async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <UncontrolledMultilineInput initialValue="Line 1" onChange={onChange} />
    );

    stdin.write('\r'); // Return
    stdin.write('Line 2');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(onChange).toHaveBeenCalledWith('Line 1\nLine 2');
  });

  test('handles cursor movement (left/right)', async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <UncontrolledMultilineInput initialValue="ABC" onChange={onChange} />
    );

    // Initial cursor at end of "ABC" (index 3)
    stdin.write('\u001b[D'); // Left -> index 2 (before 'C')
    stdin.write('\u001b[D'); // Left -> index 1 (before 'B')
    stdin.write('X');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(onChange).toHaveBeenCalledWith('AXBC');
  });

  test('handles vertical movement (up/down)', async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <UncontrolledMultilineInput initialValue={"Row 1\nRow 2"} onChange={onChange} />
    );

    // Initial cursor at end of "Row 2" (index 11)
    stdin.write('\u001b[A'); // Up arrow
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Type '!' at end of Row 1
    stdin.write('!');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(onChange).toHaveBeenCalledWith('Row 1!\nRow 2');

    // Move down to Row 2
    stdin.write('\u001b[B'); // Down arrow
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Type '?' at end of Row 2
    stdin.write('?');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(onChange).toHaveBeenCalledWith('Row 1!\nRow 2?');
  });

  test('scrolls when current line exceeds visible rows', async () => {
    const { lastFrame, stdin } = render(
      <UncontrolledMultilineInput initialValue={"L1\nL2\nL3"} rows={2} />
    );

    // Cursor is initially at end of L3.
    // So it should show L2 and L3.
    expect(stripAnsi(lastFrame() || '').includes('L1')).toBe(false);
    expect(stripAnsi(lastFrame() || '').includes('L2')).toBe(true);
    expect(stripAnsi(lastFrame() || '').includes('L3')).toBe(true);

    // Move cursor UP to L1
    stdin.write('\u001b[A'); // Up to L2
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\u001b[A'); // Up to L1
    await new Promise(resolve => setTimeout(resolve, 50));

    // Now it should show L1 and L2
    expect(stripAnsi(lastFrame() || '').includes('L1')).toBe(true);
    expect(stripAnsi(lastFrame() || '').includes('L2')).toBe(true);
    expect(stripAnsi(lastFrame() || '').includes('L3')).toBe(false);
  });

  test('Ctrl+Left moves back one word', async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <UncontrolledMultilineInput 
        initialValue="hello world" 
        onCursorChange={onCursorChange} 
      />
    );

    // ANSI sequence for Ctrl+Left: \u001b[1;5D
    stdin.write('\u001b[1;5D');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Should be at index 6 (start of "world")
    expect(onCursorChange).toHaveBeenCalledWith(6);

    stdin.write('\u001b[1;5D');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Should be at index 0 (start of "hello")
    expect(onCursorChange).toHaveBeenCalledWith(0);
  });

  test('Ctrl+Right moves forward one word', async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <UncontrolledMultilineInput 
        initialValue="hello world" 
        onCursorChange={onCursorChange} 
      />
    );

    // Initial cursor at end (11). Move to start.
    for(let i=0; i<11; i++) stdin.write('\u001b[D'); 
    await new Promise(resolve => setTimeout(resolve, 50));
    onCursorChange.mockClear();

    // ANSI sequence for Ctrl+Right: \u001b[1;5C
    stdin.write('\u001b[1;5C');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Should be at index 5 (after "hello")
    expect(onCursorChange).toHaveBeenCalledWith(5);

    stdin.write('\u001b[1;5C');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Should be at index 11 (after "world")
    expect(onCursorChange).toHaveBeenCalledWith(11);
  });
});
