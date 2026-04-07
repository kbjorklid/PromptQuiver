import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe, spyOn, beforeEach, afterEach, vi, mock } from "bun:test";
import { App } from '../App';
import * as storage from '../storage';
import { mockClipboard } from './setup';

vi.mock('clipboardy', () => ({
  default: {
    writeSync: (text: string) => mockClipboard.writeSync(text),
    readSync: () => mockClipboard.readSync(),
  },
  writeSync: (text: string) => mockClipboard.writeSync(text),
  readSync: () => mockClipboard.readSync(),
}));

const mockData = {
  main: [
    { id: '1', text: 'Line 1\n-- A comment\nLine 2', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
    { id: '2', text: 'Another prompt', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
  canned: [],
  notes: [],
  snippets: [],
  archive: [],
};

const mockLoadPrompts = async () => JSON.parse(JSON.stringify(mockData));

describe('App Comments Handling', () => {
  const mockCwd = '/test/path';
  let clipboardText = '';

  beforeEach(() => {
    clipboardText = '';
    mockClipboard.writeSync = (t) => { clipboardText = t; };
    mockClipboard.readSync = () => clipboardText;
  });

  test('Copy shortcut (c) strips comments from clipboard', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Press 'c' to copy
    stdin.write('c');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Verify toast is shown
    expect(lastFrame()).toContain('Copied to clipboard');
    
    // Verify clipboard content
    const clipboardContent = mockClipboard.readSync();
    expect(clipboardContent).toBe('Line 1\nLine 2');
  });

  test('Stage shortcut (s) strips comments from clipboard', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Press 's' to stage
    stdin.write('s');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Verify toast is shown
    expect(lastFrame()).toContain('Staged and copied to clipboard');
    
    // Verify clipboard content
    const clipboardContent = mockClipboard.readSync();
    expect(clipboardContent).toBe('Line 1\nLine 2');
  });
});
