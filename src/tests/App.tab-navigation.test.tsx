import React from 'react';
import { render } from 'ink-testing-library';
import './setup';
import { App } from '../App';
import { describe, test, expect, mock } from 'bun:test';
import type { PromptStorageData } from '../storage';

const mockCwd = '/test/cwd';

describe('App Tab Navigation', () => {
  const mockData: PromptStorageData = {
    main: [{ id: '1', text: 'Main Prompt', type: 'prompt', created_at: '', updated_at: '' }],
    notes: [{ id: '2', text: 'Note Content', type: 'note', created_at: '', updated_at: '' }],
    archive: [],
    canned: [{ id: 'c1', text: 'Canned Prompt', type: 'prompt', created_at: '', updated_at: '' }],
    snippets: [],
    settings: {
      tabVisibility: {
        main: true,
        notes: false, // Hide notes
        canned: true,
        snippets: true,
        archive: true,
        settings: true,
      }
    }
  };

  test('navigation with number keys maps to visible tabs', async () => {
    const loadPromptsFn = mock(async () => mockData);
    const { lastFrame, stdin } = render(
      <App cwd={mockCwd} loadPromptsFn={loadPromptsFn as any} />
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    // Initially on Prompt (index 1)
    expect(lastFrame()).toContain('Main Prompt');

    // Press '2'
    // orderedTabs should be ['main', 'canned', 'snippets', 'archive', 'settings'] (notes is hidden)
    // '2' should map to 'canned'
    stdin.write('2');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const frame = lastFrame();
    expect(frame).toContain('Canned Prompt');
    // It should NOT contain 'Note Content' because notes is hidden and '2' shouldn't go there
    expect(frame).not.toContain('Note Content');

    // Press '1' to go back to Prompt
    stdin.write('1');
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(lastFrame()).toContain('Main Prompt');
  });
});
