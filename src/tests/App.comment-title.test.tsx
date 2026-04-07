import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe, beforeEach, vi } from "bun:test";
import { App } from '../App';
import { mockClipboard } from './setup';

vi.mock('clipboardy', () => ({
  default: {
    writeSync: (text: string) => mockClipboard.writeSync(text),
    readSync: () => mockClipboard.readSync(),
  },
  writeSync: (text: string) => mockClipboard.writeSync(text),
  readSync: () => mockClipboard.readSync(),
}));

const mockData = {
  main: [
    { 
      id: '1', 
      text: '-- My Comment Title\n\nThis is the actual prompt content.\nIt should be on multiple lines.', 
      type: 'prompt', 
      created_at: '2023-01-01', 
      updated_at: '2023-01-01' 
    },
    { 
      id: '2', 
      text: '-- Not a title\nBecause no empty line below it.', 
      type: 'prompt', 
      created_at: '2023-01-01', 
      updated_at: '2023-01-01' 
    },
  ],
  canned: [],
  notes: [],
  snippets: [],
  archive: [],
};

const mockLoadPrompts = async () => JSON.parse(JSON.stringify(mockData));

describe('App Comment Title Handling', () => {
  const mockCwd = '/test/path';
  let clipboardText = '';

  beforeEach(() => {
    clipboardText = '';
    mockClipboard.writeSync = (t) => { clipboardText = t; };
    mockClipboard.readSync = () => clipboardText;
  });

  test('Shows comment title in listing view when followed by empty line', async () => {
    const { lastFrame } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const frame = lastFrame();
    // Prompt 1 should show the comment title
    expect(frame).toContain('My Comment Title');
    // Prompt 1 should NOT show the content in the listing (because we only show the title)
    expect(frame).not.toContain('This is the actual prompt content');
    
    // Prompt 2 should NOT show as a title because it lacks the empty line
    // It should show the first line of the prompt (the comment itself) or the first non-empty lines.
    // Wait, let's check current behavior for prompt 2.
    // If it's a normal prompt, it shows the first 2 lines.
    expect(frame).toContain('-- Not a title');
    expect(frame).toContain('Because no empty line below it');
  });

  test('Copying a prompt with comment title only copies the content and removes the leading empty line', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Prompt 1 is selected by default
    stdin.write('c');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const clipboardContent = mockClipboard.readSync();
    // It should NOT contain the comment title line
    expect(clipboardContent).not.toContain('-- My Comment Title');
    // It should NOT have a leading newline (which is what we fixed)
    expect(clipboardContent.startsWith('\n')).toBe(false);
    // It should contain the content
    expect(clipboardContent).toContain('This is the actual prompt content');
    expect(clipboardContent).toBe('This is the actual prompt content.\nIt should be on multiple lines.');
  });

  test('Normal prompts are still copied correctly', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Select Prompt 2
    stdin.write('j');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Copy
    stdin.write('c');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const clipboardContent = mockClipboard.readSync();
    // Prompt 2 is: -- Not a title\nBecause no empty line below it.
    // stripComments should remove the first line.
    expect(clipboardContent).toBe('Because no empty line below it.');
  });
});
