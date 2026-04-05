import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe } from "bun:test";
import { App } from '../App';
import type { PromptStorageData } from '../storage';
import { AppPage } from './pageObjects/AppPage';

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

const mockData: PromptStorageData = {
  main: [
    { id: '1', text: 'Prompt 1', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
    { id: '2', text: 'Prompt 2', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
  notes: [
    { id: '4', text: 'Note 1', type: 'note', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
  archive: [
    { id: '3', text: 'Archived 1', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
  canned: [],
  snippets: [],
  settings: defaultSettings,
};

const mockLoadPrompts = async () => mockData;

describe('App Component', () => {
  const mockCwd = '/test/path';

  test('renders loading state initially and then content', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts as any} viewportSize={5} />));
    
    // Wait for content to appear
    await app.waitForTextToAppear('Prompt 1');
    
    app.expectContent('Prompt');
    app.expectContent('Notes');
    app.expectContent('Archive');
    app.expectContent('Prompt 1');
  });

  test('switches tabs with Tab key', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts as any} viewportSize={5} />));
    await app.waitForTextToAppear('Prompt 1');
    
    // Initially on Prompt (Main)
    app.expectContent('Prompt 1');
    
    // Press Tab to Notes (now requires 2 tabs: Canned, then Notes)
    await app.nextTab();
    await app.nextTab();
    
    await app.waitForTextToAppear('Note 1');
    app.expectNotContent('Prompt 1');

    // Go to Archive
    await app.switchTab('archive');
    await app.waitForTextToAppear('Archived 1');
    app.expectNotContent('Note 1');
  });

  test('navigates list with arrow keys', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts as any} viewportSize={5} />));
    await app.waitForTextToAppear('Prompt 1');
    
    // Just verify it doesn't crash on navigation
    await app.arrowDown();
    await app.arrowUp();
    await app.navigateDown();
    await app.navigateUp();
  });

  test('renders empty state', async () => {
    const emptyLoad = async () => ({ 
      main: [],
      notes: [],
      archive: [],
      canned: [],
      snippets: [],
      settings: defaultSettings,
    });
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={emptyLoad} viewportSize={5} />));
    await app.waitForTextToAppear('No items yet');
    
    app.expectContent('No items yet');
  });
});
