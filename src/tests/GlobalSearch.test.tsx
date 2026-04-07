import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import './setup';
import { App } from '../App';
import { AppPage } from './pageObjects/AppPage';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { STORAGE_DIR } from '../storage/paths';

describe('Global Search', () => {
  const mockCwd = '/test/current';

  beforeEach(async () => {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    
    // Create a "project" file in storage
    const otherProjectData = {
      main: [
        { id: 'ext-1', text: 'External Prompt 1', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
      ],
      notes: [
        { id: 'ext-n1', text: 'External Note 1', type: 'note', created_at: '2023-01-01', updated_at: '2023-01-01' },
      ],
      archive: [
        { id: 'ext-a1', text: 'External Archived Prompt', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
      ]
    };
    
    await fs.writeFile(
      path.join(STORAGE_DIR, 'prompts-other-12345678.yml'),
      yaml.dump(otherProjectData)
    );
  });

  afterEach(async () => {
    await fs.rm(STORAGE_DIR, { recursive: true, force: true });
  });

  test('entering global search and searching for prompts', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} pollInterval={1000000} />));
    
    // Press 'G'
    await app.startGlobalSearch();
    await app.waitForTextToAppear('GLOBAL SEARCH');
    
    // Type query
    await app.type('External');
    
    // Should see results from the other project
    await app.waitForTextToAppear('External Prompt 1', 5000);
    app.expectContent('[other]');
    
    // Toggle to notes
    await app.nextTab();
    await new Promise(resolve => setTimeout(resolve, 800)); // Delay for debounce (300ms) + CI overhead
    await app.waitForTextToAppear('External Note 1', 5000);
    app.expectContent('[other]');
    
    // Toggle back to prompts
    await app.nextTab();
    await new Promise(resolve => setTimeout(resolve, 800)); // Delay for debounce (300ms) + CI overhead
    await app.waitForTextToAppear('External Prompt 1', 5000);
    
    // Select and edit
    await new Promise(resolve => setTimeout(resolve, 300)); // Ensure UI settled
    await app.confirm(); // Enter on first result
    await app.waitForTextToAppear('Editor', 5000);
    app.expectContent('External Prompt 1');
    
    // Save to current project
    await app.save(); // Ctrl+S
    
    // Should be back in main tab and see the copied prompt
    await app.waitForTextToAppear('Prompts', 5000);
    app.expectContent('External Prompt 1');
  });

  test('searching archive via global search', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} pollInterval={1000000} />));
    
    await app.startGlobalSearch();
    await app.waitForTextToAppear('GLOBAL SEARCH');
    
    await app.type('Archived');
    await new Promise(resolve => setTimeout(resolve, 800)); // Delay for debounce
    await app.waitForTextToAppear('External Archived Prompt', 5000);
    app.expectContent('[other]');
  });
});
