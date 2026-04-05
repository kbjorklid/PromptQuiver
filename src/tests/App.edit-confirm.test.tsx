import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe } from "bun:test";
import { App } from '../App';

const mockData = {
  main: [
    { id: '1', text: 'Original Text', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
  notes: [],
  archive: [],
};

const mockLoadPrompts = async () => JSON.parse(JSON.stringify(mockData));

describe('App Edit Confirmation', () => {
  const mockCwd = '/test/path';

  test('Exiting with Escape when text is NOT changed should exit immediately', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Press 'e' to edit
    stdin.write('e');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(lastFrame()).toContain('Original Text');
    expect(lastFrame()).toContain('[Esc] Cancel');

    // Press 'Escape'
    stdin.write('\u001b');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should be back in main view
    expect(lastFrame()).toContain('Prompt');
    expect(lastFrame()).not.toContain('[Esc] Cancel');
  });

  test('Exiting with Escape when text IS changed should show confirmation', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Press 'e' to edit
    stdin.write('e');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Change text (type ' - Added')
    stdin.write(' - Added');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(lastFrame()).toContain('Original Text - Added');

    // Press 'Escape'
    stdin.write('\u001b');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should NOT be back in main view yet, should show confirmation
    expect(lastFrame()).toContain('Save changes?');
    expect(lastFrame()).toContain('Yes');
    expect(lastFrame()).toContain('No');
    expect(lastFrame()).toContain('Cancel');
  });

  test('Confirmation dialog: Yes saves changes', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write('e');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write(' - Added');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write('\u001b'); // Escape
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(lastFrame()).toContain('Save changes?');

    stdin.write('\r'); // Enter (Yes is default)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should be back in main view and saved
    expect(lastFrame()).toContain('Prompt');
    expect(lastFrame()).toContain('Original Text - Added');
  });

  test('Confirmation dialog: No discards changes', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write('e');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write(' - Added');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write('\u001b'); // Escape
    await new Promise(resolve => setTimeout(resolve, 100));

    // Select 'No' (Right arrow once from 'Yes')
    stdin.write('\u001b[C'); 
    await new Promise(resolve => setTimeout(resolve, 100));

    stdin.write('\r'); // Enter
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should be back in main view and NOT saved
    expect(lastFrame()).toContain('Prompt');
    expect(lastFrame()).toContain('Original Text');
    expect(lastFrame()).not.toContain('Original Text - Added');
  });

  test('Confirmation dialog: Cancel stays in editor', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write('e');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write(' - Added');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write('\u001b'); // Escape
    await new Promise(resolve => setTimeout(resolve, 100));

    // Select 'Cancel' (Right arrow twice from 'Yes')
    stdin.write('\u001b[C'); 
    stdin.write('\u001b[C'); 
    await new Promise(resolve => setTimeout(resolve, 100));

    stdin.write('\r'); // Enter
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should still be in editor
    expect(lastFrame()).toContain('Original Text - Added');
    expect(lastFrame()).not.toContain('Save changes?');
    expect(lastFrame()).toContain('[Esc] Cancel');
  });

  test('Ctrl+s saves directly without confirmation', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write('e');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write(' - Added');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    stdin.write('\u0013'); // Ctrl+s
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should be back in main view and saved
    expect(lastFrame()).toContain('Prompt');
    expect(lastFrame()).toContain('Original Text - Added');
    expect(lastFrame()).not.toContain('Save changes?');
  });
});
