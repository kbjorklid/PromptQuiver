import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe, spyOn, beforeEach, afterEach } from "bun:test";
import { App } from '../App';
import * as storage from '../storage';

const mockData = {
  main: [
    { id: '1', text: 'Prompt 1\nLine 2\nLine 3', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
  notes: [],
  archive: [],
};

const mockLoadPrompts = async () => JSON.parse(JSON.stringify(mockData));

describe('App UI (Iteration 5)', () => {
  const mockCwd = '/test/path';

  test('Shows toast when copying to clipboard (y)', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts as any} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    stdin.write('y');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('Copied to clipboard');
  });

  test('Shows toast when staging prompt (s)', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts as any} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    stdin.write('s');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('Staged and copied to clipboard');
  });

  test('Truncates prompt to 2 lines', async () => {
    const { lastFrame } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts as any} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const frame = lastFrame();
    expect(frame).toContain('Prompt 1');
    expect(frame).toContain('Line 2');
    expect(frame).not.toContain('Line 3');
  });

  test('Shows deletion toast with undo hint', async () => {
    const dataWithArchive = {
      main: [],
      notes: [],
      archive: [{ id: 'arch', text: 'Archived', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' }]
    };
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={(async () => dataWithArchive) as any} />);
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
    
    // Delete
    stdin.write('d');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('Deleted');
    expect(lastFrame()).toContain("Press 'u' to undo (5s)");
  });

  test('cursor is rendered immediately after text in editor', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts as any} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Press 'e' to edit
    stdin.write('e');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const frame = lastFrame();
    expect(frame).toContain('Prompt 1');
    
    // Check if the inverse space (cursor) is present in the frame
    // \u001b[7m is the ANSI escape code for inverse
    expect(frame).toContain('\u001b[7m');
  });
});
