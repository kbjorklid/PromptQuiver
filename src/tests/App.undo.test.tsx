import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe, spyOn, beforeEach, afterEach, vi } from "bun:test";
import './setup';
import { App } from '../App';
import * as storage from '../storage';

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
};

const mockLoadPrompts = async () => JSON.parse(JSON.stringify(mockData));

describe('App Advanced Logic (Iteration 4)', () => {
  const mockCwd = '/test/path';

  test('Stage Prompt (s) marks with 🎯 and copies', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('Prompt 1');
    expect(lastFrame()).toContain('▶'); // Visual cue
    
    // Stage Prompt 1
    stdin.write('s');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('🎯');
    expect(lastFrame()).toContain('Staged and copied to clipboard');
    
    // Move to Prompt 2 and stage it
    stdin.write('j');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('s');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('Prompt 2');
    // Now Prompt 2 should have 🎯
    // Prompt 1 should be gone from main because it was staged and we staged another one
    expect(lastFrame()).not.toContain('Prompt 1');
    
    // Check archive
    // Switch tabs to archive (4 times Tab)
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('Prompt 1');
  });

  test('Staging a Canned Prompt clears others but is not marked staged', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 1. Stage Prompt 1 in Main
    stdin.write('s');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('🎯');
    
    // 2. Switch to Canned tab (Tab twice: Main -> Notes -> Canned)
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('Canned 1');
    
    // 3. Press 's' on a canned prompt
    stdin.write('s');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Should show 📋 (last copied) but NOT 🎯 (staged)
    expect(lastFrame()).toContain('📋');
    expect(lastFrame()).not.toContain('🎯');
    expect(lastFrame()).toContain('Copied to clipboard (other staged items archived)');
    
    // 4. Switch back to Main and verify Prompt 1 is gone (moved to archive)
    // Canned -> Snippets -> Archive -> Settings -> Main (4 tabs)
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).not.toContain('Prompt 1');
    expect(lastFrame()).toContain('Prompt 2');
  });

  test('Undo (u) multiple operations', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 1. Archive index 0
    stdin.write('d');
    await new Promise(resolve => setTimeout(resolve, 50));
    // 2. Archive index 0 (was index 1)
    stdin.write('d');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('No items yet');
    
    // Undo 2
    stdin.write('u');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Prompt 2');
    expect(lastFrame()).not.toContain('Prompt 1');
    
    // Undo 1
    stdin.write('u');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Prompt 1');
    expect(lastFrame()).toContain('Prompt 2');
  });

  test('Redo (Ctrl+y) multiple operations', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Archive both
    stdin.write('d');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('d');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Undo both
    stdin.write('u');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('u');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Prompt 1');
    
    // Redo 1
    stdin.write('\u0019'); // Ctrl+y
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).not.toContain('Prompt 1');
    expect(lastFrame()).toContain('Prompt 2');
    
    // Redo 2
    stdin.write('\u0019');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('No items yet');
  });

  test('Undo (u) after permanent delete (X)', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Switch to notes
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    // Switch to canned
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    // Switch to snippets
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    // Switch to archive
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Permanent delete
    stdin.write('d');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Confirm deletion (Enter)
    stdin.write('\r');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).not.toContain('Archived 1');
    
    // Undo
    stdin.write('u');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Archived 1');
  });

  test('History is cleared when a new operation is performed after undo', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 1. Archive Prompt 1
    stdin.write('d');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 2. Undo
    stdin.write('u');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Prompt 1');
    
    // 3. Perform a different operation: Delete Prompt 1 (X) from main? 
    // Wait, X is only for archive. Let's move Prompt 1 to archive again but at index 0.
    stdin.write('d');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 4. Try to redo the first archive? Redo stack should be empty.
    stdin.write('\u0019');
    await new Promise(resolve => setTimeout(resolve, 50));
    // Nothing should change from the state after step 3.
    expect(lastFrame()).not.toContain('Prompt 1');
  });

  test('Saving in Editor is undoable', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Edit first prompt
    stdin.write('e');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Type new text
    stdin.write(' Updated');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Save (Ctrl+s)
    stdin.write('\u0013');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('Prompt 1 Updated');
    
    // Undo
    stdin.write('u');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('Prompt 1');
    expect(lastFrame()).not.toContain('Prompt 1 Updated');
  });
});
