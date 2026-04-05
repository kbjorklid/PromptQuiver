import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe } from "bun:test";
import { App } from '../App';

const mockData = {
  main: [
    { id: '1', text: 'Prompt Alpha', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
    { id: '2', text: 'Prompt Beta', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
    { id: '3', text: 'Something else', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
  canned: [],
  notes: [],
  snippets: [],
  archive: [],
};

const mockLoadPrompts = async () => mockData;

describe('App Search', () => {
  const mockCwd = '/test/path';

  test('filters prompts by search query', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts as any} viewportSize={5} />);
    
    // Wait for useEffect to finish
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Initially all prompts are shown
    let frame = lastFrame();
    expect(frame).toContain('Prompt Alpha');
    expect(frame).toContain('Prompt Beta');
    expect(frame).toContain('Something else');

    // Press / to enter search mode
    stdin.write('/');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Type 'Prompt'
    stdin.write('Prompt');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    frame = lastFrame();
    expect(frame).toContain('Prompt Alpha');
    expect(frame).toContain('Prompt Beta');
    expect(frame).not.toContain('Something else');

    // Refine to 'Alpha'
    stdin.write(' Alpha');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    frame = lastFrame();
    expect(frame).toContain('Prompt Alpha');
    expect(frame).not.toContain('Prompt Beta');
    expect(frame).not.toContain('Something else');

    // Press Enter to confirm (should keep filter)
    stdin.write('\r');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    frame = lastFrame();
    expect(frame).toContain('Prompt Alpha');
    expect(frame).not.toContain('Prompt Beta');
    expect(frame).not.toContain('Something else');

    // Press Esc to clear filter
    stdin.write('\u001B');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    frame = lastFrame();
    expect(frame).toContain('Prompt Alpha');
    expect(frame).toContain('Prompt Beta');
    expect(frame).toContain('Something else');
  });

  test('enters and exits search mode with / and Esc', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts as any} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));

    // Press / to enter search mode
    stdin.write('/');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Type unique string
    stdin.write('UNIQUE_SEARCH');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(lastFrame()).toContain('UNIQUE_SEARCH');

    // Press Esc to exit search mode and clear query
    stdin.write('\u001B');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).not.toContain('UNIQUE_SEARCH');
  });
});
