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

  test('shows bullseye icon when a prompt is staged (s)', async () => {
    const { lastFrame, stdin } = render(<App cwd="/test" loadPromptsFn={mockLoadPrompts} savePromptsFn={mockSavePrompts} />);
    await new Promise(resolve => setTimeout(resolve, 50));

    // Press 's' to stage first prompt
    stdin.write('s');
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(lastFrame()).toContain('🎯');
    expect(lastFrame()).not.toContain('📋');
    expect(lastFrame()).toContain('First Prompt');
  });
});
