import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe, vi } from "bun:test";
import './setup';
import { App } from '../App';
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
  canned: [
    { id: 'c1', text: 'Canned 1', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
  archive: [
    { id: '3', text: 'Archived 1', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
  snippets: [],
};

const mockLoadPrompts = async () => JSON.parse(JSON.stringify(mockData));

describe('App Advanced Logic (Iteration 4)', () => {
  const mockCwd = '/test/path';

  test('Stage Prompt (s) marks with 🎯 and copies', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
    await app.waitForTextToAppear('Prompt 1');
    await app.wait(100);
    
    app.expectContent('Prompt 1');
    app.expectContent('▶'); // Visual cue
    
    // Stage Prompt 1
    // In AppPage I should add stagePrompt
    await app.write('s');
    await app.waitForTextToAppear('🎯');
    
    app.expectContent('🎯');
    app.expectContent('Staged and copied to clipboard');
    
    // Move to Prompt 2 and stage it
    await app.navigateDown();
    await app.write('s');
    
    await app.waitForTextToAppear('Prompt 2');
    // Now Prompt 2 should have 🎯
    // Prompt 1 should be gone from main because it was staged and we staged another one
    app.expectNotContent('Prompt 1');
    
    // Check archive
    // Switch tabs to archive
    await app.switchTab('archive');
    await app.waitForTextToAppear('Prompt 1');
    app.expectContent('Prompt 1');
  });

  test('Staging a Canned Prompt clears others but is not marked staged', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
    await app.waitForTextToAppear('Prompt 1');
    
    // 1. Stage Prompt 1 in Main
    await app.write('s');
    await app.waitForTextToAppear('🎯');
    app.expectContent('🎯');
    
    // 2. Switch to Canned tab
    await app.switchTab('canned');
    await app.waitForTextToAppear('Canned 1');
    app.expectContent('Canned 1');
    
    // 3. Press 's' on a canned prompt
    await app.write('s');
    
    // Should show 📋 (last copied) but NOT 🎯 (staged)
    await app.waitForTextToAppear('📋');
    app.expectContent('📋');
    app.expectNotContent('🎯');
    app.expectContent('Copied to clipboard (other staged items archived)');
    
    // 4. Switch back to Main and verify Prompt 1 is gone
    await app.switchTab('main');
    await app.waitForTextToDisappear('Prompt 1');
    app.expectNotContent('Prompt 1');
    app.expectContent('Prompt 2');
  });

  test('Undo (u) multiple operations', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
    await app.waitForTextToAppear('Prompt 1');
    
    // 1. Archive index 0
    await app.archivePrompt();
    await app.waitForTextToDisappear('Prompt 1');

    // 2. Archive index 0 (was index 1)
    await app.archivePrompt();
    await app.waitForTextToDisappear('Prompt 2');
    
    app.expectContent('0 prompts');
    
    // Undo 2
    await app.undo();
    await app.waitForTextToAppear('Prompt 2');
    app.expectNotContent('Prompt 1');
    
    // Undo 1
    await app.undo();
    await app.waitForTextToAppear('Prompt 1');
    app.expectContent('Prompt 1');
    app.expectContent('Prompt 2');
  });

  test('Redo (Ctrl+y) multiple operations', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
    await app.waitForTextToAppear('Prompt 1');
    
    // Archive both
    await app.archivePrompt();
    await app.waitForTextToDisappear('Prompt 1');
    await app.archivePrompt();
    await app.waitForTextToDisappear('Prompt 2');
    
    // Undo both
    await app.undo();
    await app.waitForTextToAppear('Prompt 2');
    await app.undo();
    await app.waitForTextToAppear('Prompt 1');
    app.expectContent('Prompt 1');
    
    // Redo 1
    await app.redo();
    await app.waitForTextToDisappear('Prompt 1');
    app.expectContent('Prompt 2');
    
    // Redo 2
    await app.redo();
    await app.waitForTextToDisappear('Prompt 2');
    app.expectContent('0 prompts');
  });

  test('Undo (u) after permanent delete (X)', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
    await app.waitForTextToAppear('Prompt 1');
    
    // Switch to archive
    await app.switchTab('archive');
    await app.waitForTextToAppear('Archived 1');
    
    // Permanent delete
    await app.deletePrompt();
    await app.waitForTextToAppear('Permanently delete this prompt?');
    
    // Confirm deletion (Enter)
    await app.confirm();
    
    await app.waitForTextToDisappear('Archived 1');
    
    // Undo
    await app.undo();
    await app.waitForTextToAppear('Archived 1');
    app.expectContent('Archived 1');
  });

  test('History is cleared when a new operation is performed after undo', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
    await app.waitForTextToAppear('Prompt 1');
    
    // 1. Archive Prompt 1
    await app.archivePrompt();
    await app.waitForTextToDisappear('Prompt 1');
    
    // 2. Undo
    await app.undo();
    await app.waitForTextToAppear('Prompt 1');
    app.expectContent('Prompt 1');
    
    // 3. Perform a different operation: Archive again
    await app.archivePrompt();
    await app.waitForTextToDisappear('Prompt 1');
    
    // 4. Try to redo the first archive? Redo stack should be empty.
    await app.redo();
    // Nothing should change from the state after step 3.
    app.expectNotContent('Prompt 1');
  });

  test('Saving in Editor is undoable', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
    await app.waitForTextToAppear('Prompt 1');
    
    // Edit first prompt
    await app.editPrompt();
    await app.waitForTextToAppear('Editor');
    
    // Type new text
    await app.type(' Updated');
    app.expectContent('Prompt 1 Updated');
    
    // Save (Ctrl+s)
    await app.save();
    
    await app.waitForTextToAppear('Prompt 1 Updated');
    
    // Undo
    await app.undo();
    await app.waitForTextToAppear('Prompt 1');
    app.expectContent('Prompt 1');
    app.expectNotContent('Prompt 1 Updated');
  });
});
