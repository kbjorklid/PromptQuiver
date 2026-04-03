import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe } from "bun:test";
import { App } from '../App';

const mockData = {
  main: Array.from({ length: 10 }, (_, i) => ({
    id: `${i}`,
    text: `Prompt ${i}`,
    type: 'prompt' as const,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  })),
  notes: [],
  archive: [],
};

const mockLoadPrompts = async () => mockData;

describe('App Scrolling', () => {
  test('shows only a viewport of items', async () => {
    const { lastFrame, stdin } = render(<App cwd="/test" loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Initially should show Prompts 0-4
    expect(lastFrame()).toContain('Prompt 0');
    expect(lastFrame()).toContain('Prompt 4');
    expect(lastFrame()).not.toContain('Prompt 5');
    
    // Scroll down to Prompt 5
    // Navigate 5 times down
    for (let i = 0; i < 5; i++) {
        stdin.write('j');
        await new Promise(resolve => setTimeout(resolve, 20));
    }
    
    // Viewport should shift. 
    // If selected is 5, half=2, start = 5-2 = 3. end = 3+5 = 8.
    // Should show Prompts 3-7.
    expect(lastFrame()).toContain('Prompt 5');
    expect(lastFrame()).toContain('Prompt 3');
    expect(lastFrame()).toContain('Prompt 7');
    expect(lastFrame()).not.toContain('Prompt 2');
    expect(lastFrame()).not.toContain('Prompt 8');
  });
});
