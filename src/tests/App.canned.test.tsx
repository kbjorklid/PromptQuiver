import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe, spyOn } from "bun:test";
import { App } from '../App';
import * as gitUtils from '../utils/git';
import { getCommonStoragePath } from '../storage/paths';
import { savePrompts } from '../storage/index';
import fs from 'fs/promises';

const mockData = {
  main: [
    { id: '1', text: 'Prompt 1', type: 'prompt', branch: 'feat/abc', created_at: '2023-01-01', updated_at: '2023-01-01' },
    { id: '2', text: 'Prompt 2', type: 'prompt', branch: 'feat/xyz', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
  notes: [],
  canned: [
    { id: '4', text: 'Canned 1', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
  archive: [],
};

const mockLoadPrompts = async () => mockData;

describe('App Canned Tab', () => {
  const mockCwd = '/test/path';

  test('renders Canned tab in the header', async () => {
    const { lastFrame } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts as any} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('Canned');
  });

  test('switches to Canned tab with Tab key', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts as any} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Press Tab twice (from Prompt -> Notes -> Canned)
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('Canned 1');
  });

  test('Canned tab ignores branch filter', async () => {
    // Mock git branch to return 'feat/abc'
    const gitSpy = spyOn(gitUtils, 'getCurrentGitBranch').mockReturnValue('feat/abc');
    
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts as any} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Toggle branch filter on (press 'b')
    stdin.write('b');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // On Prompt tab, only 'Prompt 1' should be visible
    expect(lastFrame()).toContain('Prompt 1');
    expect(lastFrame()).not.toContain('Prompt 2');
    
    // Switch to Canned tab (Prompt -> Notes -> Canned)
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 'Canned 1' should still be visible even if it has no branch
    expect(lastFrame()).toContain('Canned 1');
    
    gitSpy.mockRestore();
  });

  test('saves canned prompts to common.yml', async () => {
    const commonPath = getCommonStoragePath();
    const mockCwd = '/test/path';
    
    const data = {
      main: [],
      notes: [],
      archive: [],
      canned: [
        { id: 'save-test', text: 'To be saved', type: 'prompt' as const, created_at: 'now', updated_at: 'now' }
      ]
    };

    await savePrompts(mockCwd, data);
    
    const content = await fs.readFile(commonPath, 'utf-8');
    expect(content).toContain('To be saved');
    expect(content).toContain('canned-prompts:');
  });
});
