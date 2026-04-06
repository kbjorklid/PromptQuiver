import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe, spyOn, beforeEach, afterEach } from "bun:test";
import { App } from '../App';
import * as storage from '../storage';

const mockData = {
  main: [
    { id: '1', text: 'Prompt 1', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
  canned: [],
  notes: [],
  snippets: [],
  archive: [],
};

const mockLoadPrompts = async () => JSON.parse(JSON.stringify(mockData));

describe('App Copy Shortcut', () => {
  const mockCwd = '/test/path';

  test('Copy shortcut (y) does not change state', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    stdin.write('y');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('Prompt 1');
  });

  test('Copy shortcut (c) does not change state', async () => {
    const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    stdin.write('c');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastFrame()).toContain('Prompt 1');
  });
});
