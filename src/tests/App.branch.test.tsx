import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../App';
import { expect, test, describe, vi, beforeEach, afterEach } from 'bun:test';
import * as child_process from 'child_process';
import type { PromptStorageData } from '../storage';

// Mock the git utility via module mocking
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

const stripAnsi = (str: string) => str.replace(/\u001b\[[0-9;]*m/g, '');

describe('App Branch Tracking', () => {
  const mockCwd = '/test/path';
  let mockData: PromptStorageData;
  let mockLoadPrompts: any;

  beforeEach(() => {
    mockData = {
      main: [
        { id: '1', text: 'Prompt 1', type: 'prompt', branch: 'main', created_at: '2023-01-01', updated_at: '2023-01-01' },
        { id: '2', text: 'Prompt 2', type: 'prompt', branch: 'feature-x', created_at: '2023-01-01', updated_at: '2023-01-01' },
      ],
      notes: [],
      archive: [],
    };
    mockLoadPrompts = async () => JSON.parse(JSON.stringify(mockData));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('adds current branch to new prompt', async () => {
    (child_process.execSync as any).mockReturnValue('feature-new\n');
    const saveSpy = vi.fn().mockResolvedValue(undefined);

    const { stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} savePromptsFn={saveSpy} debounceMs={0} viewportSize={5} />);

    // Wait for load
    await new Promise(resolve => setTimeout(resolve, 50));

    // Press 'a' to add a prompt
    stdin.write('a');
    await new Promise(resolve => setTimeout(resolve, 50));

    // Type something
    stdin.write('New Branch Prompt');
    await new Promise(resolve => setTimeout(resolve, 50));

    // Save (Ctrl+s)
    stdin.write('\u0013');
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(saveSpy).toHaveBeenCalled();
    const savedData = saveSpy.mock.calls[saveSpy.mock.calls.length - 1]![1] as PromptStorageData;
    const newPrompt = savedData.main.find(p => p.text === 'New Branch Prompt');
    expect(newPrompt).toBeDefined();
    expect(newPrompt?.branch).toBe('feature-new');
  });

  test('toggles branch filter with "b" key', async () => {
    (child_process.execSync as any).mockReturnValue('feature-x\n');
    
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} savePromptsFn={vi.fn()} debounceMs={0} viewportSize={5} />);

    // Wait for load
    await new Promise(resolve => setTimeout(resolve, 50));

    // Initially, both prompts should be visible, and branch name should be in footer
    expect(stripAnsi(lastFrame() || '')).toContain('Prompt 1');
    expect(stripAnsi(lastFrame() || '')).toContain('Prompt 2');
    expect(stripAnsi(lastFrame() || '')).toContain('feature-x');

    // Press 'b' to toggle branch filter
    stdin.write('b');
    await new Promise(resolve => setTimeout(resolve, 50));

    // Now, only 'Prompt 2' (which is on 'feature-x') should be visible
    expect(stripAnsi(lastFrame() || '')).not.toContain('Prompt 1');
    expect(stripAnsi(lastFrame() || '')).toContain('Prompt 2');
    expect(stripAnsi(lastFrame() || '')).toContain('feature-x');

    // Press 'b' again to turn off branch filter
    stdin.write('b');
    await new Promise(resolve => setTimeout(resolve, 50));

    // Both should be visible again
    expect(stripAnsi(lastFrame() || '')).toContain('Prompt 1');
    expect(stripAnsi(lastFrame() || '')).toContain('Prompt 2');
    expect(stripAnsi(lastFrame() || '')).toContain('feature-x');
  });

  test('shows all items if no current branch is detected, even if filter is enabled', async () => {
    (child_process.execSync as any).mockImplementation(() => { throw new Error('Not a git repo'); });
    
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} savePromptsFn={vi.fn()} debounceMs={0} viewportSize={5} />);

    // Wait for load
    await new Promise(resolve => setTimeout(resolve, 50));

    // Enable branch filter
    stdin.write('b');
    await new Promise(resolve => setTimeout(resolve, 50));

    // Both prompts should still be visible because currentBranch is undefined
    expect(stripAnsi(lastFrame() || '')).toContain('Prompt 1');
    expect(stripAnsi(lastFrame() || '')).toContain('Prompt 2');
    expect(stripAnsi(lastFrame() || '')).not.toContain('Branch:');
  });
});