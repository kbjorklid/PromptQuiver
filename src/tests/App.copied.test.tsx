import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../App';
import { expect, test, describe, mock } from 'bun:test';
import type { PromptStorageData } from '../storage';

const mockData: PromptStorageData = {
  main: [
    { id: '1', text: 'First Prompt', type: 'prompt', created_at: '', updated_at: '' },
    { id: '2', text: 'Second Prompt', type: 'prompt', created_at: '', updated_at: '' },
  ],
  notes: [],
  archive: [],
};

const mockLoadPrompts = () => Promise.resolve(mockData);
const mockSavePrompts = mock(() => Promise.resolve());

describe('App Last Copied Icon', () => {
  test('shows clipboard icon when a prompt is yanked (y)', async () => {
    const { lastFrame, stdin } = render(<App cwd="/test" loadPromptsFn={mockLoadPrompts} savePromptsFn={mockSavePrompts} />);
    await new Promise(resolve => setTimeout(resolve, 50));

    // Press 'y' to copy first prompt
    stdin.write('y');
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(lastFrame()).toContain('📋');
    expect(lastFrame()).toContain('First Prompt');
  });

  test('shows clipboard icon when a prompt is processed (N)', async () => {
    const { lastFrame, stdin } = render(<App cwd="/test" loadPromptsFn={mockLoadPrompts} savePromptsFn={mockSavePrompts} />);
    await new Promise(resolve => setTimeout(resolve, 50));

    // Press 'N' to process first prompt
    stdin.write('N');
    await new Promise(resolve => setTimeout(resolve, 50));

    // It should now be in archive, but the state should still track it if rendered (though it won't be in main anymore)
    // Actually, PromptList only renders currentList. 
    // Let's check archive tab
    stdin.write('l'); // to Notes
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('l'); // to Archive
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('📋');
    expect(lastFrame()).toContain('First Prompt');
  });
});
