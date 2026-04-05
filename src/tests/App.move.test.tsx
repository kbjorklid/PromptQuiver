import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../App';
import { describe, test, expect, vi, beforeEach } from 'bun:test';
import type { PromptStorageData } from '../storage';

// Mock clipboardy
vi.mock('clipboardy', () => ({
  default: {
    writeSync: vi.fn(),
  },
}));

const stripAnsi = (str: string) => str.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');

const defaultSettings = {
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

describe('App Move Mode', () => {
  const mockData: PromptStorageData = {
    main: [
      { id: '1', text: 'FIRST PROMPT', type: 'prompt', created_at: '', updated_at: '' },
      { id: '2', text: 'SECOND PROMPT', type: 'prompt', created_at: '', updated_at: '' },
      { id: '3', text: 'THIRD PROMPT', type: 'prompt', created_at: '', updated_at: '' },
    ],
    notes: [
      { id: 'n1', text: 'Note 1', type: 'note', created_at: '', updated_at: '' },
    ],
    canned: [],
    snippets: [],
    archive: [],
    settings: defaultSettings,
  };

  const mockLoad = vi.fn().mockResolvedValue(mockData);
  const mockSave = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('enters and exits move mode with "m"', async () => {
    const { stdin, lastFrame } = render(
      <App cwd="/test" loadPromptsFn={mockLoad as any} savePromptsFn={mockSave as any} viewportSize={10} />
    );

    // Wait for load
    await new Promise(resolve => setTimeout(resolve, 50));

    // Press 'm' to enter move mode
    stdin.write('m');
    await new Promise(resolve => setTimeout(resolve, 50));
    let frame = stripAnsi(lastFrame()!);
    expect(frame).toContain('Move mode');
    expect(frame).toContain('↕');

    // Press 'm' to exit
    stdin.write('m');
    await new Promise(resolve => setTimeout(resolve, 50));
    frame = stripAnsi(lastFrame()!);
    expect(frame).toContain('Exit move mode');
    expect(frame).toContain('▶');
  });

  test('moves item up and down in list', async () => {
    const { stdin, lastFrame } = render(
      <App cwd="/test" loadPromptsFn={mockLoad as any} savePromptsFn={mockSave as any} viewportSize={10} />
    );

    await new Promise(resolve => setTimeout(resolve, 50));

    // Enter move mode on first item
    stdin.write('m');
    await new Promise(resolve => setTimeout(resolve, 50));

    // Move down
    stdin.write('\u001b[B'); // Down arrow
    await new Promise(resolve => setTimeout(resolve, 50));

    // Check order: SECOND PROMPT should now be first, FIRST PROMPT second
    let frame = stripAnsi(lastFrame()!);
    const p1Index = frame.indexOf('FIRST PROMPT');
    const p2Index = frame.indexOf('SECOND PROMPT');
    expect(p2Index).toBeLessThan(p1Index);
    
    // Selection should follow the item
    expect(frame).toContain('2. ↕'); // FIRST PROMPT is now at index 1 (display 2)

    // Move up
    stdin.write('\u001b[A'); // Up arrow
    await new Promise(resolve => setTimeout(resolve, 50));
    
    frame = stripAnsi(lastFrame()!);
    expect(frame.indexOf('FIRST PROMPT')).toBeLessThan(frame.indexOf('SECOND PROMPT'));
    expect(frame).toContain('1. ↕');
  });

  test('exits move mode with Enter or Esc', async () => {
    const { stdin, lastFrame } = render(
      <App cwd="/test" loadPromptsFn={mockLoad as any} savePromptsFn={mockSave as any} viewportSize={10} />
    );

    await new Promise(resolve => setTimeout(resolve, 50));

    // Enter move mode
    stdin.write('m');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(stripAnsi(lastFrame()!)).toContain('↕');

    // Press Enter to exit
    stdin.write('\r');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(stripAnsi(lastFrame()!)).toContain('▶');

    // Re-enter
    stdin.write('m');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(stripAnsi(lastFrame()!)).toContain('↕');

    // Press Esc to exit
    stdin.write('\u001b');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(stripAnsi(lastFrame()!)).toContain('▶');
  });

  test('undoes move operation', async () => {
    const { stdin, lastFrame } = render(
      <App cwd="/test" loadPromptsFn={mockLoad as any} savePromptsFn={mockSave as any} viewportSize={10} />
    );

    await new Promise(resolve => setTimeout(resolve, 50));

    // Move first item down
    stdin.write('m');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\u001b[B'); // Down
    await new Promise(resolve => setTimeout(resolve, 100));
    stdin.write('m'); // Exit
    await new Promise(resolve => setTimeout(resolve, 100));

    let frame = stripAnsi(lastFrame()!);
    // console.log('Frame after move in undo test:', frame);
    expect(frame.indexOf('SECOND PROMPT')).toBeLessThan(frame.indexOf('FIRST PROMPT'));

    // Undo
    stdin.write('u');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    frame = stripAnsi(lastFrame()!);
    expect(frame.indexOf('FIRST PROMPT')).toBeLessThan(frame.indexOf('SECOND PROMPT'));
  });
});
