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

// Helper to wait for UI updates in CI
const waitForText = async (lastFrame: () => string | undefined, text: string, reverse = false) => {
  for (let i = 0; i < 10; i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    const frame = lastFrame() || '';
    if (reverse ? !frame.includes(text) : frame.includes(text)) {
      break;
    }
  }
};

describe('App Archive Delete Confirmation', () => {
  const mockCwd = '/test/path';

  test('Pressing d in archive should show confirmation dialog', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write('5');
    await waitForText(lastFrame, 'Archived Prompt');
    expect(lastFrame()).toContain('Archived Prompt');

    // Press 'd' to delete
    stdin.write('d');
    await waitForText(lastFrame, 'Permanently delete this prompt?');
    
    expect(lastFrame()).toContain('Permanently delete this prompt?');
    expect(lastFrame()).toContain('Yes');
    expect(lastFrame()).toContain('No');
  });

  test('Confirming deletion with Yes should remove the prompt', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write('5');
    await waitForText(lastFrame, 'Archived Prompt');
    
    stdin.write('d');
    await waitForText(lastFrame, 'Permanently delete this prompt?');

    // Yes is default, press Enter
    stdin.write('\r');
    await waitForText(lastFrame, 'Deleted');

    expect(lastFrame()).not.toContain('Archived Prompt');
    expect(lastFrame()).toContain('Deleted');
  });

  test('Cancelling deletion with No should keep the prompt', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write('5');
    await waitForText(lastFrame, 'Archived Prompt');
    
    stdin.write('d');
    await waitForText(lastFrame, 'Permanently delete this prompt?');

    // Select 'No' (Right arrow)
    stdin.write('\u001b[C'); 
    await new Promise(resolve => setTimeout(resolve, 100));

    stdin.write('\r'); // Enter
    // Wait for the modal to disappear
    await waitForText(lastFrame, 'Permanently delete this prompt?', true);

    expect(lastFrame()).toContain('Archived Prompt');
    expect(lastFrame()).not.toContain('Deleted');
  });

  test('Escape should also cancel the deletion', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write('5');
    await waitForText(lastFrame, 'Archived Prompt');
    
    stdin.write('d');
    await waitForText(lastFrame, 'Permanently delete this prompt?');

    stdin.write('\u001b'); // Escape
    await waitForText(lastFrame, 'Permanently delete this prompt?', true);

    expect(lastFrame()).toContain('Archived Prompt');
    expect(lastFrame()).not.toContain('Permanently delete this prompt?');
  });
});
