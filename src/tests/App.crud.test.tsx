import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe, spyOn, beforeEach, afterEach, vi } from "bun:test";
import './setup';
import { App } from '../App';
import * as storage from '../storage';
import { AppPage } from './pageObjects/AppPage';

vi.mock('clipboardy', () => ({
  default: {
    writeSync: () => {},
    readSync: () => "",
  },
  writeSync: () => {},
  readSync: () => "",
}));

const mockData = {
  main: [
    { id: '1', text: 'Prompt 1', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
    { id: '2', text: 'Prompt 2', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
  notes: [],
  canned: [],
  snippets: [],
  archive: [
    { id: '3', text: 'Archived 1', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
  };

const mockLoadPrompts = async () => JSON.parse(JSON.stringify(mockData));

describe('App CRUD Operations', () => {
  const mockCwd = '/test/path';

  test('archiving a prompt (d) from prompt tab', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
    await app.waitForTextToAppear('Prompt 1');
    
    // Select first prompt and archive
    // Add extra wait to ensure app is ready for input
    await app.wait(100);
    await app.archivePrompt();
    
    // Prompt 1 should be gone from prompt tab
    await app.waitForTextToDisappear('Prompt 1', 1000);
    app.expectContent('Prompt 2');
    
    // Switch to archive
    await app.switchTab('archive');
    await app.waitForTextToAppear('Prompt 1');
    app.expectContent('Prompt 1');
    app.expectContent('Archived 1');
  });

  test('un-archiving a prompt (r) from archive', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
    await app.waitForTextToAppear('Prompt 1');
    
    // Switch to archive
    await app.switchTab('archive');
    await app.waitForTextToAppear('Archived 1');
    
    // Select Archived 1 (index 0) and restore
    await app.restorePrompt();
    
    await app.waitForTextToDisappear('Archived 1');
    
    // Switch to prompt
    await app.switchTab('main');
    await app.waitForTextToAppear('Archived 1');
    app.expectContent('Archived 1');
  });

  test('permanent delete (d) from archive', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
    await app.waitForTextToAppear('Prompt 1');
    
    // Switch to archive
    await app.switchTab('archive');
    await app.waitForTextToAppear('Archived 1');
    
    // Select Archived 1, press 'd'
    await app.deletePrompt();
    
    // Confirm deletion (Enter)
    await app.waitForTextToAppear('Permanently delete this prompt?');
    await app.confirm();
    
    await app.waitForTextToDisappear('Archived 1');
    app.expectNotContent('Archived 1');
  });

  test('adding a prompt (a) after selected in prompt tab and saving', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
    await app.waitForTextToAppear('Prompt 1');
    
    // Select index 0, press 'a'
    await app.addPrompt();
    
    await app.waitForTextToAppear('Editor');
    app.expectInEditor();
    
    // Type something
    await app.type('New Prompt Content');
    app.expectContent('New Prompt Content');
    
    // Save (Ctrl+s)
    await app.save();
    
    await app.waitForTextToAppear('Prompt');
    app.expectContent('New Prompt Content');
  });

  test('editing a prompt (e) and cancelling', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
    await app.waitForTextToAppear('Prompt 1');
    
    // Select index 0, press 'e'
    await app.editPrompt();
    await app.wait(200);
    
    await app.waitForTextToAppear('Editor');
    app.expectInEditor();
    app.expectContent('Prompt 1');
    
    // Type something
    await app.type(' changed');
    app.expectContent('Prompt 1 changed');
    
    // Cancel (Esc)
    await app.cancel();

    // Handle confirmation dialog. Select 'No' to discard.
    await app.waitForTextToAppear('Save changes?');
    await app.arrowRight(); // Select 'No'
    await app.confirm();
    
    await app.waitForTextToAppear('Prompt 1');
    app.expectContent('Prompt 1');
    app.expectNotContent('Prompt 1 changed');
  });

  test('adding a prompt (A) at end of main', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
    await app.waitForTextToAppear('Prompt 1');
    
    await app.addPromptAtEnd();
    await app.waitForTextToAppear('Editor');
    await app.type('At the end');
    await app.save();
    
    await app.waitForTextToAppear('At the end');
    app.expectContent('At the end');
  });

  test('adding a prompt (i) before selected in main', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
    await app.waitForTextToAppear('Prompt 1');
    
    // Select Prompt 2
    await app.navigateDown();
    
    await app.insertPromptBefore();
    await app.waitForTextToAppear('Editor');
    await app.type('Inserted before 2');
    await app.save();
    
    await app.waitForTextToAppear('Inserted before 2');
    app.expectContent('Inserted before 2');
  });

  test('adding a prompt (I) at beginning of main', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
    await app.waitForTextToAppear('Prompt 1');
    
    await app.insertPromptAtStart();
    await app.waitForTextToAppear('Editor');
    await app.type('At the start');
    await app.save();
    
    await app.waitForTextToAppear('At the start');
    app.expectContent('At the start');
  });

  test('adding a note and ensuring it stays in the Notes tab', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
    await app.waitForTextToAppear('Prompt 1');
    
    // Switch to notes
    await app.switchTab('notes');
    await app.waitForTextToAppear('Notes');
    app.expectContent('Notes');
    
    // Add note
    await app.addPrompt();
    await app.waitForTextToAppear('Editor');
    app.expectInEditor();
    
    // Type note content
    await app.type('New Note Content');
    
    // Save (Ctrl+s)
    await app.save(); 
    
    await app.waitForTextToAppear('New Note Content');
    app.expectContent('Notes');
    app.expectContent('New Note Content');
  });
});
