import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe } from "bun:test";
import { App } from '../App';
import type { PromptStorageData } from '../storage';

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
    const { lastFrame } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts as any} viewportSize={5} />);
    
    // Wait for useEffect to finish
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const frame = lastFrame();
    expect(frame).toContain('Prompt');
    expect(frame).toContain('Notes');
    expect(frame).toContain('Archive');
    expect(frame).toContain('Prompt 1');
  });

  test('switches tabs with Tab key', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts as any} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Initially on Prompt (Main)
    expect(lastFrame()).toContain('Prompt 1');
    
    // Press Tab once to Notes
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Note 1');
    expect(lastFrame()).not.toContain('Prompt 1');

    // Press Tab twice more to Canned then Snippets then Archive
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Archived 1');
    expect(lastFrame()).not.toContain('Note 1');
  });

  test('navigates list with arrow keys', async () => {
    const { stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts as any} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Just verify it doesn't crash on navigation
    stdin.write('\u001B[B'); // Down arrow
    await new Promise(resolve => setTimeout(resolve, 20));
    stdin.write('\u001B[A'); // Up arrow
    await new Promise(resolve => setTimeout(resolve, 20));
    stdin.write('j');
    await new Promise(resolve => setTimeout(resolve, 20));
    stdin.write('k');
    await new Promise(resolve => setTimeout(resolve, 20));
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
    const { lastFrame } = render(<App cwd={mockCwd} loadPromptsFn={emptyLoad} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('No items yet');
  });
});
