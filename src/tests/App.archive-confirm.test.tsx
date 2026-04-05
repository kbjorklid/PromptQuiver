import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe } from "bun:test";
import { App } from '../App';

const mockData = {
  main: [],
  notes: [],
  canned: [],
  snippets: [],
  archive: [
    { id: '1', text: 'Archived Prompt', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
};

const mockLoadPrompts = async () => JSON.parse(JSON.stringify(mockData));

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe.skip('App Archive Delete Confirmation', () => {
  const mockCwd = '/test/path';

  const navigateToArchive = async (stdin: any) => {
    // Switch to notes
    stdin.write('\t');
    await delay(100);
    // Switch to canned
    stdin.write('\t');
    await delay(100);
    // Switch to snippets
    stdin.write('\t');
    await delay(100);
    // Switch to archive
    stdin.write('\t');
    await delay(100);
  };

  test('Pressing d in archive should show confirmation dialog', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await delay(100);
    
    await navigateToArchive(stdin);
    expect(lastFrame()).toContain('Archived Prompt');

    // Press 'd' to delete
    stdin.write('d');
    await delay(100);
    
    expect(lastFrame()).toContain('Permanently delete this prompt?');
    expect(lastFrame()).toContain('Yes');
    expect(lastFrame()).toContain('No');
  });

  test('Confirming deletion with Yes should remove the prompt', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await delay(100);
    
    await navigateToArchive(stdin);
    
    stdin.write('d');
    await delay(100);

    // Yes is default, press Enter
    stdin.write('\r');
    await delay(100);

    expect(lastFrame()).not.toContain('Archived Prompt');
    expect(lastFrame()).toContain('Deleted');
  });

  test('Cancelling deletion with No should keep the prompt', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await delay(100);
    
    await navigateToArchive(stdin);
    
    stdin.write('d');
    await delay(100);

    // Select 'No' (Right arrow)
    stdin.write('\u001b[C'); 
    await delay(100);

    stdin.write('\r'); // Enter
    await delay(100);

    expect(lastFrame()).toContain('Archived Prompt');
    expect(lastFrame()).not.toContain('Deleted');
  });

  test('Escape should also cancel the deletion', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await delay(100);
    
    await navigateToArchive(stdin);
    
    stdin.write('d');
    await delay(100);

    stdin.write('\u001b'); // Escape
    await delay(100);

    expect(lastFrame()).toContain('Archived Prompt');
    expect(lastFrame()).not.toContain('Permanently delete this prompt?');
  });
});

