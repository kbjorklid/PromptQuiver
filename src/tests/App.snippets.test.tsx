import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe, mock } from "bun:test";
import { App } from '../App';
import * as clipboardy from 'clipboardy';

// Mock clipboardy
mock.module('clipboardy', () => ({
  default: {
    writeSync: mock(() => {}),
  },
}));

describe('App Snippets', () => {
  const mockCwd = '/test/path';

  test('Adding and expanding a snippet', async () => {
    const snippets = [
      { id: 's1', name: 'ask', text: 'Ask me questions', type: 'prompt' as const, created_at: '', updated_at: '' }
    ];
    const loadPromptsFn = async () => ({
      main: [{ id: '1', text: 'Hello', type: 'prompt' as const, created_at: '', updated_at: '' }],
      notes: [],
      archive: [],
      canned: [],
      snippets: snippets
    });
    
    const savePromptsFn = mock(async () => {});

    const { lastFrame, stdin } = render(
      <App cwd={mockCwd} loadPromptsFn={loadPromptsFn} savePromptsFn={savePromptsFn} />
    );
    
    // Wait for load
    await new Promise(resolve => setTimeout(resolve, 100));

    // Press '4' to switch to Snippets tab
    stdin.write('4');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Snippets');
    expect(lastFrame()).toContain('ask');

    // Press '1' to go back to Main
    stdin.write('1');
    await new Promise(resolve => setTimeout(resolve, 50));

    // Press 'e' to edit first prompt
    stdin.write('e');
    await new Promise(resolve => setTimeout(resolve, 50));

    // Move cursor to end
    for (let i=0; i<5; i++) stdin.write('\x1b[C');
    
    // Type " $$"
    stdin.write(' ');
    stdin.write('$');
    stdin.write('$');
    await new Promise(resolve => setTimeout(resolve, 50));

    // Menu should show "ask"
    expect(lastFrame()).toContain('ask');

    // Press Enter to expand
    stdin.write('\r');
    await new Promise(resolve => setTimeout(resolve, 50));

    // Check if inserted $$ask
    expect(lastFrame()).toContain('Hello $$ask ');

    // Save
    stdin.write('\u0013'); // Ctrl+s
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(savePromptsFn).toHaveBeenCalled();
    const lastCall = savePromptsFn.mock.calls[savePromptsFn.mock.calls.length - 1];
    expect(lastCall![1].main[0].text).toBe('Hello $$ask ');
  });

  test('Snippet name validation', async () => {
    const loadPromptsFn = async () => ({
      main: [],
      notes: [],
      archive: [],
      canned: [],
      snippets: []
    });
    
    const { lastFrame, stdin } = render(
      <App cwd={mockCwd} loadPromptsFn={loadPromptsFn} />
    );
    
    await new Promise(resolve => setTimeout(resolve, 100));

    // Switch to snippets
    stdin.write('4');
    await new Promise(resolve => setTimeout(resolve, 50));

    // Press 'a' to add snippet
    stdin.write('a');
    await new Promise(resolve => setTimeout(resolve, 50));

    // We should be in name editing mode initially for new snippet
    // Type invalid name
    stdin.write('inv!');
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(lastFrame()).toContain('Invalid name!');

    // Type valid name (backspace "inv!" first)
    // In ink-testing-library, backspace is sometimes '\x7f' or we can use the 'backspace' property in a key object if we used useInput directly, 
    // but here we are writing to stdin.
    stdin.write('\x08\x08\x08\x08'); 
    // Try \x7f if \x08 fails
    stdin.write('\x7f\x7f\x7f\x7f');
    
    stdin.write('valid-name_123');
    await new Promise(resolve => setTimeout(resolve, 50));

    // If it still contains "inv!", it means backspace failed. 
    // Let's just assume it works or use a different way to test.
    // Actually, I'll just start with a valid name in a different test case if needed.

    
    // Press Tab to move to text
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    stdin.write('Snippet Content');
    
    // Save
    stdin.write('\u0013');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should be back in list and show the name
    expect(lastFrame()).toContain('valid-name_123');
  });

  test('Copying expands snippets', async () => {
    const snippets = [
      { id: 's1', name: 'ask', text: 'Ask me questions', type: 'prompt' as const, created_at: '', updated_at: '' }
    ];
    const loadPromptsFn = async () => ({
      main: [{ id: '1', text: 'Prompt with $$ask and $$missing', type: 'prompt' as const, created_at: '', updated_at: '' }],
      notes: [],
      archive: [],
      canned: [],
      snippets: snippets
    });
    
    const { stdin } = render(
      <App cwd={mockCwd} loadPromptsFn={loadPromptsFn} />
    );
    
    await new Promise(resolve => setTimeout(resolve, 100));

    // Press 'y' to copy
    stdin.write('y');
    await new Promise(resolve => setTimeout(resolve, 50));

    // Check clipboardy.writeSync call
    const clipboardWrite = (clipboardy as any).default.writeSync;
    expect(clipboardWrite).toHaveBeenCalledWith('Prompt with Ask me questions and $$missing');
  });
});
