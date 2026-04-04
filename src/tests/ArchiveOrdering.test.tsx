import { render } from 'ink-testing-library';
import React from 'react';
import { App } from '../App';
import { expect, test, describe, mock } from 'bun:test';
import type { PromptStorageData } from '../storage';

const mockCwd = '/test/cwd';

describe('Archive ordering', () => {
  test('recently archived prompt is at the top', async () => {
    const initialData: PromptStorageData = {
      main: [
        { id: '1', text: 'Prompt 1', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
        { id: '2', text: 'Prompt 2', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
      ],
      notes: [],
      archive: [
        { id: '3', text: 'Old Archive', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
      ],
      canned: [],
      snippets: []
    };

    const loadPromptsFn = async () => initialData;
    const savePromptsFn = mock(async () => {});

    const { lastFrame, stdin } = render(
      <App cwd={mockCwd} loadPromptsFn={loadPromptsFn as any} savePromptsFn={savePromptsFn as any} viewportSize={10} />
    );

    // Wait for loading
    await new Promise(resolve => setTimeout(resolve, 100));

    // Archive Prompt 1 (press 'd')
    stdin.write('d');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Switch to Archive (press '5')
    stdin.write('5');
    await new Promise(resolve => setTimeout(resolve, 50));

    const frame = lastFrame();
    
    // We expect 'Prompt 1' then 'Old Archive'
    const prompt1Pos = frame?.indexOf('Prompt 1');
    const oldArchivePos = frame?.indexOf('Old Archive');
    
    expect(prompt1Pos).toBeLessThan(oldArchivePos!);
  });

  test('m key does nothing in archive', async () => {
    const initialData: PromptStorageData = {
      main: [],
      notes: [],
      archive: [
        { id: '1', text: 'Archived 1', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
        { id: '2', text: 'Archived 2', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
      ],
      canned: [],
      snippets: []
    };

    const loadPromptsFn = async () => initialData;
    const { lastFrame, stdin } = render(
      <App cwd={mockCwd} loadPromptsFn={loadPromptsFn as any} />
    );

    // Wait for loading
    await new Promise(resolve => setTimeout(resolve, 100));

    // Switch to Archive
    stdin.write('5');
    
    // Press 'm'
    stdin.write('m');
    
    expect(lastFrame()).not.toContain('Move mode');
  });
});
