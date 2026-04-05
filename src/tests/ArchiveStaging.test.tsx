import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe } from "bun:test";
import { App } from '../App';
import type { PromptStorageData } from '../storage';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Archive Staging', () => {
  const mockCwd = '/test/path';

  test('Moving a staged prompt to archive should clear its staged status', async () => {
    const mockData: PromptStorageData = {
      main: [
        { id: '1', text: 'Staged Prompt', type: 'prompt', staged: true, created_at: '2023-01-01', updated_at: '2023-01-01' },
      ],
      notes: [],
      canned: [],
      snippets: [],
      archive: [],
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

    const mockLoadPrompts = async () => JSON.parse(JSON.stringify(mockData));

    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts as any} viewportSize={5} />);
    await delay(100);

    // Verify it is staged in main (should show 🎯)
    expect(lastFrame()).toContain('🎯');
    expect(lastFrame()).toContain('Staged Prompt');

    // Archive it (press 'd')
    stdin.write('d');
    await delay(200);

    // Verify it's gone from main
    expect(lastFrame()).not.toContain('Staged Prompt');

    // Switch to archive (4 times Tab)
    stdin.write('\t'); await delay(100); // notes
    stdin.write('\t'); await delay(100); // canned
    stdin.write('\t'); await delay(100); // snippets
    stdin.write('\t'); await delay(100); // archive

    expect(lastFrame()).toContain('Archive');
    expect(lastFrame()).toContain('Staged Prompt');
    
    // It SHOULD NOT show 🎯 anymore
    expect(lastFrame()).not.toContain('🎯');
  });
});
