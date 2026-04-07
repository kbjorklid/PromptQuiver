import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe, vi, beforeEach, afterEach } from 'bun:test';
import * as gitUtils from '../utils/git';
import { App } from '../App';
import { AppPage } from './pageObjects/AppPage';

// Mock the git utility
vi.mock('../utils/git', () => ({
  getCurrentGitBranch: vi.fn(),
}));

describe('App Branch Auto-detection', () => {
  const mockCwd = '/test/path';
  let mockData: any;
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

    const app = new AppPage(render(
      <App 
        cwd={mockCwd} 
        loadPromptsFn={mockLoadPrompts} 
        savePromptsFn={vi.fn()} 
        debounceMs={0} 
        viewportSize={5} 
        pollInterval={100} // Short poll interval
      />
    ));

    // Wait for initial load
    await app.waitForTextToAppear('branch: main');

    // Change branch
    currentBranch = 'feature-x';
    
    // Wait for auto-update
    await app.waitForTextToAppear('branch: feature-x', 3000);
  });

  test('updates filtering when branch changes periodically when filter is ON', async () => {
    let currentBranch = 'main';
    (gitUtils.getCurrentGitBranch as any).mockImplementation(() => currentBranch);

    const app = new AppPage(render(
      <App 
        cwd={mockCwd} 
        loadPromptsFn={mockLoadPrompts} 
        savePromptsFn={vi.fn()} 
        debounceMs={0} 
        viewportSize={5} 
        pollInterval={100} 
      />
    ));

    // Wait for load
    await app.waitForTextToAppear('Prompt 1');
    
    // Enable branch filter
    await app.write('b');
    
    app.expectContent('Prompt 1');
    app.expectNotContent('Prompt 2');

    // Change branch
    currentBranch = 'feature-x';
    
    // Wait for auto-update and filtering change
    await app.waitForTextToAppear('Prompt 2', 3000);
    app.expectNotContent('Prompt 1');
    app.expectContent('branch: feature-x');
  });
});
