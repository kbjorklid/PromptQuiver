import React from 'react';
import { render } from 'ink-testing-library';
import './setup';
import { App } from '../App';
import { describe, test, expect, mock } from 'bun:test';
import type { PromptStorageData } from '../storage';
import { AppPage } from './pageObjects/AppPage';

const mockCwd = '/test/cwd';

describe('App Tab Navigation', () => {
  const mockData: PromptStorageData = {
    main: [{ id: '1', text: 'Main Prompt', type: 'prompt', created_at: '', updated_at: '' }],
    canned: [{ id: 'c1', text: 'Canned Prompt', type: 'prompt', created_at: '', updated_at: '' }],
    notes: [],
    snippets: [],
    archive: [],
    settings: {
      tabVisibility: {
        main: true,
        notes: false, // Hide notes
        canned: true,
        snippets: true,
        archive: true,
        settings: true,
      },
      slashCommands: [],
    }
  };

  test('navigation with number keys maps to visible tabs', async () => {
    const loadPromptsFn = mock(async () => mockData);
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={loadPromptsFn as any} viewportSize={5} />));

    await app.waitForTextToAppear('Main Prompt');

    // Initially on Prompt (index 1)
    app.expectContent('Main Prompt');

    // Press '2'
    // orderedTabs should be ['main', 'canned', 'snippets', 'archive', 'settings'] (notes is hidden)
    // '2' should map to 'canned'
    await app.switchTabByNumber(2);
    await app.waitForTextToAppear('Canned Prompt');
    
    app.expectContent('Canned Prompt');
    // It should NOT contain 'Note Content' because notes is hidden and '2' shouldn't go there
    app.expectNotContent('Note Content');

    // Press '1' to go back to Prompt
    await app.switchTabByNumber(1);
    await app.waitForTextToAppear('Main Prompt');
    app.expectContent('Main Prompt');
  });

  test('navigation with number keys with multiple hidden tabs', async () => {
    const multiHiddenData: PromptStorageData = {
      main: [{ id: '1', text: 'Main Prompt', type: 'prompt', created_at: '', updated_at: '' }],
      notes: [{ id: '2', text: 'Note Content', type: 'note', created_at: '', updated_at: '' }],
      canned: [{ id: 'c1', text: 'Canned Prompt', type: 'prompt', created_at: '', updated_at: '' }],
      snippets: [{ id: 's1', text: 'Snippet Content', type: 'prompt', created_at: '', updated_at: '', name: 'test' }],
      archive: [],
      settings: {
        tabVisibility: {
          main: true,
          notes: false,
          canned: false,
          snippets: true,
          archive: false,
          settings: true,
        },
        slashCommands: [],
      }
    };

    const loadPromptsFn = mock(async () => multiHiddenData);
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={loadPromptsFn as any} viewportSize={5} />));

    await app.waitForTextToAppear('Main Prompt');

    // Visible tabs: Prompt (1), Snippets (2), Settings (3)
    
    // Press '2' -> should go to Snippets
    await app.switchTabByNumber(2);
    await app.waitForTextToAppear('test'); // Snippet name
    app.expectContent('test');

    // Press '3' -> should go to Settings
    await app.switchTabByNumber(3);
    await app.waitForTextToAppear('Tab Visibility'); // Settings view indicator
    app.expectContent('Tab Visibility');

    // Press '1' -> back to Prompt
    await app.switchTabByNumber(1);
    await app.waitForTextToAppear('Main Prompt');
    app.expectContent('Main Prompt');
  });
});
