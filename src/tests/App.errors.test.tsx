import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../App';
import { expect, test, describe, vi } from 'bun:test';
import clipboardy from 'clipboardy';

// Define a variable to control the mock behavior
let shouldThrow = false;

vi.mock('clipboardy', () => ({
  default: {
    writeSync: (text: string) => {
      if (shouldThrow) throw new Error('Clipboard error');
    },
  },
  writeSync: (text: string) => {
    if (shouldThrow) throw new Error('Clipboard error');
  },
}));

describe('App Error Paths', () => {
  test('shows toast when clipboard.writeSync fails during Yank (y)', async () => {
    const mockData = {
      main: [{ id: '1', text: 'Prompt 1', type: 'prompt', created_at: '', updated_at: '' }],
      notes: [],
      archive: []
    };
    const loadPromptsFn = vi.fn().mockResolvedValue(mockData);
    
    shouldThrow = true;

    const { stdin, lastFrame } = render(<App cwd="test-cwd" loadPromptsFn={loadPromptsFn} viewportSize={5} />);

    // Wait for load
    await new Promise(resolve => setTimeout(resolve, 150));

    // Press 'y' to yank
    stdin.write('y');
    
    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check for error toast
    expect(lastFrame()?.includes('Failed to copy to clipboard')).toBe(true);
  });

  test('shows toast when clipboard.writeSync fails during Stage (s)', async () => {
    const mockData = {
      main: [{ id: '1', text: 'Prompt 1', type: 'prompt', created_at: '', updated_at: '' }],
      notes: [],
      archive: []
    };
    const loadPromptsFn = vi.fn().mockResolvedValue(mockData);
    
    shouldThrow = true;

    const { stdin, lastFrame } = render(<App cwd="test-cwd" loadPromptsFn={loadPromptsFn} viewportSize={5} />);

    // Wait for load
    await new Promise(resolve => setTimeout(resolve, 150));

    // Press 's' to stage
    stdin.write('s');
    
    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check for error toast
    expect(lastFrame()?.includes('Staged (clipboard error)')).toBe(true);
  });
});
