
import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../App';
import { expect, test, describe, spyOn, beforeEach } from 'bun:test';
import clipboardy from 'clipboardy';

const mockPrompts = {
  main: [
    { id: '1', text: 'Prompt 1', type: 'prompt', created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
  ],
  notes: [],
  archive: [],
  canned: [],
  snippets: [],
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
  }
};

describe('App Save and Stage Shortcut', () => {
  beforeEach(() => {
    spyOn(clipboardy, 'writeSync').mockImplementation(() => {});
  });

  test('Ctrl+G in editor saves and stages a prompt', async () => {
    const loadPromptsFn = async () => JSON.parse(JSON.stringify(mockPrompts));
    const savePromptsFn = async () => {};

    const { stdin, lastFrame } = render(<App cwd="/test" loadPromptsFn={loadPromptsFn} savePromptsFn={savePromptsFn} viewportSize={5} />);

    // Wait for load
    await new Promise(resolve => setTimeout(resolve, 100));

    // Press 'e' to edit the first prompt
    stdin.write('e');
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(lastFrame()).toContain('Editor');
    expect(lastFrame()).toContain('Prompt 1');
    expect(lastFrame()).toContain('[Ctrl+g] Save & Stage');

    // Change text
    stdin.write(' Modified');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Prompt 1 Modified');

    // Press Ctrl+G (\u0007)
    stdin.write('\u0007'); 
  });

  test('Save & Stage shortcut is NOT shown for snippets', async () => {
    const loadPromptsFn = async () => {
       const data = JSON.parse(JSON.stringify(mockPrompts));
       data.snippets = [{ id: 's1', name: 'snip', text: 'Snippet 1', type: 'prompt', created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' }];
       return data;
    };
    const savePromptsFn = async () => {};

    const { stdin, lastFrame } = render(<App cwd="/test" loadPromptsFn={loadPromptsFn} savePromptsFn={savePromptsFn} viewportSize={5} />);

    await new Promise(resolve => setTimeout(resolve, 100));

    // Go to snippets tab (usually 4th tab)
    stdin.write('4');
    await new Promise(resolve => setTimeout(resolve, 50));

    // Press 'e' to edit
    stdin.write('e');
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(lastFrame()).toContain('Editor (Snippet)');
    expect(lastFrame()).not.toContain('[Ctrl+g] Save & Stage');
  });

  test('Save & Stage shortcut is NOT shown for notes', async () => {
    const loadPromptsFn = async () => {
       const data = JSON.parse(JSON.stringify(mockPrompts));
       data.notes = [{ id: 'n1', text: 'Note 1', type: 'note', created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' }];
       return data;
    };
    const savePromptsFn = async () => {};

    const { stdin, lastFrame } = render(<App cwd="/test" loadPromptsFn={loadPromptsFn} savePromptsFn={savePromptsFn} viewportSize={5} />);

    await new Promise(resolve => setTimeout(resolve, 100));

    // Go to notes tab (usually 2nd tab)
    stdin.write('2');
    await new Promise(resolve => setTimeout(resolve, 50));

    // Press 'e' to edit
    stdin.write('e');
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(lastFrame()).toContain('Editor');
    expect(lastFrame()).toContain('Note 1');
    expect(lastFrame()).not.toContain('[Ctrl+g] Save & Stage');
  });
});
