import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe, spyOn, vi } from "bun:test";
import { mockClipboard } from './setup';
import { App } from '../App';
import { AppPage } from './pageObjects/AppPage';

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
    { id: '1', text: 'Prompt 1', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
  notes: [],
  canned: [],
  snippets: [],
  archive: [],
};

const mockLoadPrompts = async () => JSON.parse(JSON.stringify(mockData));

describe('App Paste Operations', () => {
  const mockCwd = '/test/path';

  test('pasting a prompt (p) in main tab adds it after current', async () => {
    const originalReadSync = mockClipboard.readSync;
    mockClipboard.readSync = () => 'Pasted Content';
    
    try {
      const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
      await app.waitForTextToAppear('Prompt 1');
      
      await app.pastePrompt();
      
      await app.waitForTextToAppear('Pasted Content');
      app.expectContent('Pasted Content');
      app.expectContent('Pasted to Prompts');
    } finally {
      mockClipboard.readSync = originalReadSync;
    }
  });

  test('pasting a prompt (Ctrl+V) in main tab adds it after current', async () => {
    const originalReadSync = mockClipboard.readSync;
    mockClipboard.readSync = () => 'Ctrl+V Content';
    
    try {
      const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
      await app.waitForTextToAppear('Prompt 1');
      
      await app.pastePromptCtrlV();
      
      await app.waitForTextToAppear('Ctrl+V Content');
      app.expectContent('Ctrl+V Content');
    } finally {
      mockClipboard.readSync = originalReadSync;
    }
  });

  test('pasting a note (p) in notes tab adds it as a note', async () => {
    const originalReadSync = mockClipboard.readSync;
    mockClipboard.readSync = () => 'Pasted Note';
    
    try {
      const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
      await app.waitForTextToAppear('Prompt 1');
      
      await app.switchTab('notes');
      await app.waitForTextToAppear('Notes');
      
      await app.pastePrompt();
      
      await app.waitForTextToAppear('Pasted Note');
      app.expectContent('Pasted Note');
      app.expectContent('Pasted to Notes');
    } finally {
      mockClipboard.readSync = originalReadSync;
    }
  });

  test('pasting when list is empty', async () => {
    const emptyLoad = async () => ({ main: [], notes: [], canned: [], snippets: [], archive: [] });
    const originalReadSync = mockClipboard.readSync;
    mockClipboard.readSync = () => 'First Content';
    
    try {
      const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={emptyLoad} viewportSize={5} />));
      await app.waitForTextToAppear('Prompt');

      await app.pastePrompt();
      await app.waitForTextToAppear('First Content');
      app.expectContent('First Content');
    } finally {
      mockClipboard.readSync = originalReadSync;
    }
  });
});
