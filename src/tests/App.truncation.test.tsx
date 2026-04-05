import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe } from "bun:test";
import { App } from '../App';

const mockData = {
  main: [
    { 
      id: '1', 
      text: '\n  First Line  \n\n  Second Line  \n  Third Line  ', 
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

const mockLoadPrompts = async () => mockData;

describe('App Truncation', () => {
  test('shows first two non-empty lines and trims them', async () => {
    const { lastFrame } = render(<App cwd="/test" loadPromptsFn={mockLoadPrompts as any} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const frame = lastFrame();
    expect(frame).toContain('First Line');
    expect(frame).toContain('Second Line');
    expect(frame).not.toContain('Third Line');
  });
});
