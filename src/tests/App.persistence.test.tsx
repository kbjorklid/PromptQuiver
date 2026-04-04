import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe, spyOn, jest, afterEach } from "bun:test";
import { App } from '../App';
import * as storage from '../storage';

const mockData = {
  main: [
    { id: '1', text: 'Prompt 1', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
  notes: [],
  archive: [],
};

const mockLoadPrompts = async () => JSON.parse(JSON.stringify(mockData));

describe('App Persistence', () => {
  const mockCwd = '/test/path';

  test('calls savePromptsFn when a prompt is added', async () => {
    const saveSpy = jest.fn();
    const { stdin } = render(
      <App 
        cwd={mockCwd} 
        loadPromptsFn={mockLoadPrompts} 
        savePromptsFn={saveSpy as any} 
        debounceMs={0}
      />
    );
    
    // Wait for initial load
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Clear the initial save call (if any)
    saveSpy.mockClear();

    // Press 'a' to add a prompt
    stdin.write('a');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Type something
    stdin.write('New Prompt Content');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Save (Ctrl+s)
    stdin.write('\u0013'); 
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(saveSpy).toHaveBeenCalled();
    const lastCall = saveSpy.mock.calls[saveSpy.mock.calls.length - 1];
    expect(lastCall![0]).toBe(mockCwd);
    expect(lastCall![1].main.length).toBe(2);
    expect(lastCall![1].main[1].text).toBe('New Prompt Content');
  });

  test('calls savePromptsFn when a prompt is deleted', async () => {
    const saveSpy = jest.fn();
    const { stdin } = render(
      <App 
        cwd={mockCwd} 
        loadPromptsFn={mockLoadPrompts} 
        savePromptsFn={saveSpy as any} 
        debounceMs={0}
      />
    );
    
    // Wait for initial load
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Archive first (d)
    stdin.write('d');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Clear calls
    saveSpy.mockClear();

    // Switch to Archive (Tab, Tab, Tab, Tab)
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write('\t');
    await new Promise(resolve => setTimeout(resolve, 50));

    // Permanent delete (d)
    stdin.write('d');
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(saveSpy).toHaveBeenCalled();
    const lastCall = saveSpy.mock.calls[saveSpy.mock.calls.length - 1];
    expect(lastCall![1].archive.length).toBe(0);
  });
});
