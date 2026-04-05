import { render } from 'ink-testing-library';
import React from 'react';
import { App } from '../App';
import { expect, test, describe } from 'bun:test';

describe('App Stage Visibility', () => {
  const mockData = {
    main: [{ id: '1', text: 'Main Prompt', type: 'prompt', staged: false, created_at: '', updated_at: '' }],
    notes: [{ id: '2', text: 'Note Prompt', type: 'note', created_at: '', updated_at: '' }],
    snippets: [{ id: '3', text: 'Snippet', type: 'prompt', name: 'snip', created_at: '', updated_at: '' }],
    archive: [],
    canned: [],
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

  const loadPromptsFn = async () => mockData as any;
  const savePromptsFn = async () => {};

  test('Stage hint [s] is NOT shown for notes', async () => {
    const { lastFrame, stdin } = render(<App cwd="/test" loadPromptsFn={loadPromptsFn} savePromptsFn={savePromptsFn} viewportSize={5} />);

    // Wait for load
    await new Promise(r => setTimeout(r, 100));

    // Switch to Notes (Tab 2)
    stdin.write('2');
    await new Promise(r => setTimeout(r, 100));

    expect(lastFrame()).toContain('Note Prompt');
    expect(lastFrame()).not.toMatch(/\[s\].*Stage/);
  });

  test('Stage hint [s] is NOT shown for snippets', async () => {
    const { lastFrame, stdin } = render(<App cwd="/test" loadPromptsFn={loadPromptsFn} savePromptsFn={savePromptsFn} viewportSize={5} />);

    // Wait for load
    await new Promise(r => setTimeout(r, 100));

    // Switch to Snippets (Tab 4)
    stdin.write('4');
    await new Promise(r => setTimeout(r, 100));

    expect(lastFrame()).toContain('Snippet');
    expect(lastFrame()).not.toMatch(/\[s\].*Stage/);
  });

  test('Stage shortcut (s) does NOT work for notes', async () => {
    const { lastFrame, stdin } = render(<App cwd="/test" loadPromptsFn={loadPromptsFn} savePromptsFn={savePromptsFn} viewportSize={5} />);

    await new Promise(r => setTimeout(r, 100));
    stdin.write('2'); // Notes
    await new Promise(r => setTimeout(r, 100));

    stdin.write('s');
    await new Promise(r => setTimeout(r, 100));

    expect(lastFrame()).not.toContain('Staged and copied to clipboard');
    expect(lastFrame()).not.toContain('🎯');
  });
});
