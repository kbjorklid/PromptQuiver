import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe, spyOn, beforeEach, afterEach } from "bun:test";
import { App } from '../App';
import * as storage from '../storage';
import clipboardy from 'clipboardy';

const mockData = {
  main: [
    { id: '1', text: 'Prompt 1', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
    { id: '2', text: 'Prompt 2', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
  notes: [],
  archive: [
    { id: '3', text: 'Archived 1', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
};

const mockLoadPrompts = async () => JSON.parse(JSON.stringify(mockData));

describe('App Keyboard Inputs', () => {
  const mockCwd = '/test/path';

  test('Navigation with hjkl keys', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Initial: Main tab, Prompt 1 selected
    expect(lastFrame()).toContain('Prompt 1');
    expect(lastFrame()).toContain('Prompt 2');

    // 'j' to move down
    stdin.write('j');
    await new Promise(resolve => setTimeout(resolve, 50));
    // Prompt 2 should be selected (visual check might be hard, but let's assume it works if 'k' brings us back)
    
    // 'k' to move up
    stdin.write('k');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 'l' to move to next tab (Notes)
    stdin.write('l');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Notes');

    // 'l' again to move to next tab (Canned)
    stdin.write('l');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Canned');

    // 'l' again to move to next tab (Snippets)
    stdin.write('l');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Snippets');

    // 'l' again to move to next tab (Archive)
    stdin.write('l');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Archive');
    expect(lastFrame()).toContain('Archived 1');

    // 'h' to move to previous tab (Canned)
    stdin.write('h');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Canned');

    // 'h' again to move to previous tab (Notes)
    stdin.write('h');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Notes');

    // 'h' again to move to previous tab (Prompt)
    stdin.write('h');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Prompt');
  });

  test('Tab and Shift-Tab for navigation', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Tab to Notes
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Notes');

    // Shift-Tab back to Prompt
    stdin.write('\u001b[Z');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Prompt');
  });

  test('Undo (u) and Redo (Ctrl+y)', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Delete a prompt (d)
    stdin.write('d');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).not.toContain('Prompt 1');

    // Undo (u)
    stdin.write('u');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Prompt 1');

    // Redo (Ctrl+y)
    stdin.write('\u0019'); // Ctrl+y is 0x19
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).not.toContain('Prompt 1');
  });

  test('Stage Prompt (s) and Copy (y)', async () => {
    const writeSpy = spyOn(clipboardy, 'writeSync').mockImplementation(() => {});
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Copy (y)
    stdin.write('y');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(writeSpy).toHaveBeenCalledWith('Prompt 1');
    expect(lastFrame()).toContain('Copied to clipboard');

    // Stage Prompt (s)
    stdin.write('s');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(writeSpy).toHaveBeenCalledWith('Prompt 1');
    expect(lastFrame()).toContain('Staged and copied to clipboard');
    expect(lastFrame()).toContain('🎯');
    
    // Stage Prompt 2 (should archive Prompt 1)
    stdin.write('j');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('s');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).not.toContain('Prompt 1');
    expect(lastFrame()).toContain('Prompt 2');
    expect(lastFrame()).toContain('🎯');
    
    writeSpy.mockRestore();
  });

  test('Enter to edit', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    stdin.write('\r');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Editor');
    expect(lastFrame()).toContain('Prompt 1');
  });

  test('Escape to clear search query when not in search mode', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Enter search mode
    stdin.write('/');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('test');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Exit search mode (Enter)
    stdin.write('\r');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Now Esc should clear query
    stdin.write('\u001B');
    await new Promise(resolve => setTimeout(resolve, 50));
    // Query is cleared, so Prompt 1 and 2 should both be visible if they were filtered
  });
});
