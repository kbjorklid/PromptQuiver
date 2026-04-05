import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe } from "bun:test";
import { App } from '../App';

const mockData = {
  main: [],
  notes: [],
  archive: [
    { id: '1', text: 'Archived Prompt', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
};

const mockLoadPrompts = async () => JSON.parse(JSON.stringify(mockData));

describe('App Archive Delete Confirmation', () => {
  const mockCwd = '/test/path';

  test('Pressing d in archive should show confirmation dialog', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Switch to Archive tab (orderedTabs: main, canned, snippets, archive, settings -> tab 4)
    // Wait, by default all tabs are visible. 1.Main, 2.Notes, 3.Canned, 4.Snippets, 5.Archive
    stdin.write('5');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(lastFrame()).toContain('Archived Prompt');

    // Press 'd' to delete
    stdin.write('d');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(lastFrame()).toContain('Permanently delete this prompt?');
    expect(lastFrame()).toContain('Yes');
    expect(lastFrame()).toContain('No');
  });

  test('Confirming deletion with Yes should remove the prompt', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write('5');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write('d');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Yes is default, press Enter
    stdin.write('\r');
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(lastFrame()).not.toContain('Archived Prompt');
    expect(lastFrame()).toContain('Deleted');
  });

  test('Cancelling deletion with No should keep the prompt', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write('5');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write('d');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Select 'No' (Right arrow)
    stdin.write('\u001b[C'); 
    await new Promise(resolve => setTimeout(resolve, 100));

    stdin.write('\r'); // Enter
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(lastFrame()).toContain('Archived Prompt');
    expect(lastFrame()).not.toContain('Deleted');
  });

  test('Escape should also cancel the deletion', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write('5');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write('d');
    await new Promise(resolve => setTimeout(resolve, 100));

    stdin.write('\u001b'); // Escape
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(lastFrame()).toContain('Archived Prompt');
    expect(lastFrame()).not.toContain('Permanently delete this prompt?');
  });
});
