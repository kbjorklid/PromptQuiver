import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../App';
import { expect, test, describe, vi } from 'bun:test';
import type { PromptStorageData } from '../storage/paths';
import type { Settings } from '../hooks/types';

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

const defaultSettings: Settings = {
  tabVisibility: {
    main: true,
    notes: true,
    canned: true,
    snippets: true,
    archive: true,
    settings: true,
  },
  slashCommands: [],
};

describe('App Error Paths', () => {
  test('shows toast when clipboard.writeSync fails during Copy (c/y)', async () => {
    const mockData: PromptStorageData = {
      main: [{ id: '1', text: 'Prompt 1', type: 'prompt', created_at: '', updated_at: '' }],
  canned: [],
  notes: [],
  snippets: [],
  archive: [],
      settings: defaultSettings,
    };
    const loadPromptsFn = vi.fn().mockResolvedValue(mockData);
    
    shouldThrow = true;

    const { stdin, lastFrame } = render(<App cwd="test-cwd" loadPromptsFn={loadPromptsFn} viewportSize={5} />);

    // Wait for load
    await new Promise(resolve => setTimeout(resolve, 150));

    // Press 'c' to copy
    stdin.write('c');
    
    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check for error toast
    expect(lastFrame()?.includes('Failed to copy to clipboard')).toBe(true);
  });

  test('shows toast when clipboard.writeSync fails during Stage (s)', async () => {
    const mockData: PromptStorageData = {
      main: [{ id: '1', text: 'Prompt 1', type: 'prompt', created_at: '', updated_at: '' }],
      notes: [],
      archive: [],
      canned: [],
      snippets: [],
      settings: defaultSettings,
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
