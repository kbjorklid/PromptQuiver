import React from 'react';
import { render } from 'ink-testing-library';
import './setup';
import { App } from '../App';
import { expect, test, describe, mock, vi } from 'bun:test';
import type { PromptStorageData } from '../storage';

vi.mock('clipboardy', () => ({
  default: {
    writeSync: () => {},
    readSync: () => "",
  },
  writeSync: () => {},
  readSync: () => "",
}));

const mockData: PromptStorageData = {
  main: [
    { id: '1', text: 'First Prompt', type: 'prompt', created_at: '', updated_at: '' },
    { id: '2', text: 'Second Prompt', type: 'prompt', created_at: '', updated_at: '' },
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

const mockLoadPrompts = () => Promise.resolve(mockData);
const mockSavePrompts = mock(() => Promise.resolve());

describe('App Last Copied Icon', () => {
  test('shows clipboard icon when a prompt is yanked (y)', async () => {
    const { lastFrame, stdin } = render(<App cwd="/test" loadPromptsFn={mockLoadPrompts} savePromptsFn={mockSavePrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));

    // Press 'y' to copy first prompt
    stdin.write('y');
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(lastFrame()).toContain('📋');
    expect(lastFrame()).toContain('First Prompt');
  });

  test('shows bullseye icon when a prompt is staged (s)', async () => {
    const { lastFrame, stdin } = render(<App cwd="/test" loadPromptsFn={mockLoadPrompts} savePromptsFn={mockSavePrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));

    // Press 's' to stage first prompt
    stdin.write('s');
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(lastFrame()).toContain('🎯');
    expect(lastFrame()).not.toContain('📋');
    expect(lastFrame()).toContain('First Prompt');
  });
});
