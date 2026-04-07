import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe, vi, beforeEach, afterEach } from 'bun:test';
import * as gitUtils from '../utils/git';
import { App } from '../App';
import type { PromptStorageData } from '../storage';

// Mock the git utility
vi.mock('../utils/git', () => ({
  getCurrentGitBranch: vi.fn(),
}));

const stripAnsi = (str: string) => str.replace(/\u001b\[[0-9;]*m/g, '');

describe('App Branch Auto-detection', () => {
  const mockCwd = '/test/path';
  let mockData: PromptStorageData;
  let mockLoadPrompts: any;

  beforeEach(() => {
    mockData = {
      main: [
        { id: '1', text: 'Prompt 1', type: 'prompt', branch: 'main', created_at: '2023-01-01', updated_at: '2023-01-01' },
        { id: '2', text: 'Prompt 2', type: 'prompt', branch: 'feature-x', created_at: '2023-01-01', updated_at: '2023-01-01' },
      ],
      canned: [],
      notes: [],
      snippets: [],
      archive: [],
      settings: {
        tabVisibility: {
          main: true,
          notes: true,
          canned: true,
          snippets: true,
          archive: true,
          settings: true,
        },
        slashCommands: [],
      },
    };
    mockLoadPrompts = async () => JSON.parse(JSON.stringify(mockData));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('updates branch name in footer periodically (using short pollInterval)', async () => {
    let currentBranch = 'main';
    (gitUtils.getCurrentGitBranch as any).mockImplementation(() => currentBranch);

    const { lastFrame } = render(
      <App 
        cwd={mockCwd} 
        loadPromptsFn={mockLoadPrompts} 
        savePromptsFn={vi.fn()} 
        debounceMs={0} 
        viewportSize={5} 
        pollInterval={250} // 250ms poll interval for stability
      />
    );

    // Wait for initial load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    expect(stripAnsi(lastFrame() || '')).toContain('branch: main');

    // Change branch
    currentBranch = 'feature-x';
    
    // Wait for next poll
    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(stripAnsi(lastFrame() || '')).toContain('branch: feature-x');
  });

  test('updates filtering when branch changes periodically when filter is ON', async () => {
    let currentBranch = 'main';
    (gitUtils.getCurrentGitBranch as any).mockImplementation(() => currentBranch);

    const { lastFrame, stdin } = render(
      <App 
        cwd={mockCwd} 
        loadPromptsFn={mockLoadPrompts} 
        savePromptsFn={vi.fn()} 
        debounceMs={0} 
        viewportSize={5} 
        pollInterval={250} 
      />
    );

    // Wait for load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Enable branch filter
    stdin.write('b');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    expect(stripAnsi(lastFrame() || '')).toContain('Prompt 1');
    expect(stripAnsi(lastFrame() || '')).not.toContain('Prompt 2');

    // Change branch
    currentBranch = 'feature-x';
    
    // Wait for poll
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Should now show Prompt 2 and hide Prompt 1
    expect(stripAnsi(lastFrame() || '')).not.toContain('Prompt 1');
    expect(stripAnsi(lastFrame() || '')).toContain('Prompt 2');
    expect(stripAnsi(lastFrame() || '')).toContain('branch: feature-x');
  });
});
