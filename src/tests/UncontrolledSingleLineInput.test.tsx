import React from 'react';
import { render } from 'ink-testing-library';
import { UncontrolledSingleLineInput } from '../components/UncontrolledSingleLineInput';
import { expect, test, describe, vi } from 'bun:test';

// ANSI sequences for Ctrl+Left and Ctrl+Right
const CTRL_LEFT = '\u001b[1;5D';
const CTRL_RIGHT = '\u001b[1;5C';

describe('UncontrolledSingleLineInput', () => {
  test('Ctrl+Left moves back one word', async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <UncontrolledSingleLineInput 
        initialValue="hello world" 
        onChange={onChange}
      />
    );

    stdin.write(CTRL_LEFT); // index 6
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('!');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(onChange).toHaveBeenCalledWith('hello !world');
  });

  test('Ctrl+Right moves forward one word', async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <UncontrolledSingleLineInput 
        initialValue="hello world" 
        onChange={onChange}
      />
    );

    // Initial cursor at end (11). Move to start.
    for(let i=0; i<11; i++) stdin.write('\u001b[D'); 
    await new Promise(resolve => setTimeout(resolve, 50));
    
    stdin.write(CTRL_RIGHT); // index 5
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('!');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(onChange).toHaveBeenCalledWith('hello! world');
  });
  
  test('handles basic typing', async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <UncontrolledSingleLineInput initialValue="ABC" onChange={onChange} />
    );

    stdin.write('D');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(onChange).toHaveBeenCalledWith('ABCD');
  });

  test('handles backspace', async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <UncontrolledSingleLineInput initialValue="ABC" onChange={onChange} />
    );

    stdin.write('\b'); // Backspace
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(onChange).toHaveBeenCalledWith('AB');
  });
});
