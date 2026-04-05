import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe, spyOn, beforeEach, afterEach, vi } from "bun:test";
import './setup';
import { App } from '../App';
import * as storage from '../storage';

vi.mock('clipboardy', () => ({
  default: {
    writeSync: () => {},
    readSync: () => "",
  },
  writeSync: () => {},
  readSync: () => "",
}));

const mockData = {
  main: [
    { id: '1', text: 'Prompt 1', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
    { id: '2', text: 'Prompt 2', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
  notes: [],
  canned: [],
  snippets: [],
  archive: [
    { id: '3', text: 'Archived 1', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
  };

const mockLoadPrompts = async () => JSON.parse(JSON.stringify(mockData));

describe('App CRUD Operations', () => {
  const mockCwd = '/test/path';

  test('archiving a prompt (d) from prompt tab', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Select first prompt
    stdin.write('d');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const frame = lastFrame();
    // Prompt 1 should be gone from prompt tab (or at least not visible if we stay in prompt tab)
    expect(frame).not.toContain('Prompt 1');
    expect(frame).toContain('Prompt 2');
    
    // Switch to archive
    stdin.write('5');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Prompt 1');
    expect(lastFrame()).toContain('Archived 1');
  });

  test('un-archiving a prompt (r) from archive', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Switch to archive
    stdin.write('5');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Select Archived 1 (index 0)
    stdin.write('r');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).not.toContain('Archived 1');
    
    // Switch to prompt (wrap around via Settings)
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Archived 1');
  });

  test('permanent delete (d) from archive', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Switch to archive
    stdin.write('5');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Select Archived 1, press 'd'
    stdin.write('d');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Confirm deletion (Enter)
    stdin.write('\r');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).not.toContain('Archived 1');
  });

  test('adding a prompt (a) after selected in prompt tab and saving', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Select index 0, press 'a'
    stdin.write('a');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('Editor');
    
    // Type something
    stdin.write('New Prompt Content');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('New Prompt Content');
    
    // Save (Ctrl+s)
    stdin.write('\u0013'); 
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('Prompt');
    expect(lastFrame()).toContain('New Prompt Content');
  });

  test('editing a prompt (e) and cancelling', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Select index 0, press 'e'
    stdin.write('e');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('Editor');
    expect(lastFrame()).toContain('Prompt 1');
    
    // Type something
    stdin.write(' changed');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Prompt 1 changed');
    
    // Cancel (Esc)
    stdin.write('\u001B');
    await new Promise(resolve => setTimeout(resolve, 50));

    // New: Handle confirmation dialog. Select 'No' to discard.
    expect(lastFrame()).toContain('Save changes?');
    stdin.write('\u001b[C'); // Right arrow
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\r'); // Enter
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('Prompt');
    expect(lastFrame()).toContain('Prompt 1');
    expect(lastFrame()).not.toContain('Prompt 1 changed');
  });

  test('adding a prompt (A) at end of main', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    stdin.write('A');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('At the end');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\u0013'); // Save
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('At the end');
  });

  test('adding a prompt (i) before selected in main', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Select Prompt 2
    stdin.write('j');
    await new Promise(resolve => setTimeout(resolve, 20));
    
    stdin.write('i');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('Inserted before 2');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\u0013'); // Save
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('Inserted before 2');
  });

  test('adding a prompt (I) at beginning of main', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    stdin.write('I');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('At the start');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\u0013'); // Save
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('At the start');
  });

  test('adding a note and ensuring it stays in the Notes tab', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Switch to notes
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Notes');
    
    // Add note
    stdin.write('a');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Editor');
    
    // Type note content
    stdin.write('New Note Content');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Save (Ctrl+s)
    stdin.write('\u0013'); 
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const frame = lastFrame();
    expect(frame).toContain('Notes');
    expect(frame).toContain('New Note Content');
  });
});
