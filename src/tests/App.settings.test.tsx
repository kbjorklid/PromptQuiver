import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../App';
import { describe, test, expect, mock, beforeEach } from 'bun:test';
import type { PromptStorageData } from '../storage';

const mockCwd = '/test/cwd';

const stripAnsi = (str: string) => str.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');

describe('App Settings', () => {
  const initialData: PromptStorageData = {
    main: [],
    notes: [],
    archive: [],
    canned: [],
    snippets: [],
    settings: {
      tabVisibility: {
        main: true,
        notes: true,
        canned: true,
        snippets: true,
        archive: true,
        settings: true,
      }
    }
  };

  test('ctrl-s opens settings tab', async () => {
    const loadPromptsFn = async () => initialData;
    const { lastFrame, stdin } = render(
      <App cwd={mockCwd} loadPromptsFn={loadPromptsFn as any} />
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    // Initially on main
    expect(stripAnsi(lastFrame()!)).toContain('1. Prompt');

    // Press ctrl-s
    stdin.write('\u0013'); // Ctrl-S
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(stripAnsi(lastFrame()!)).toContain('Tab Visibility');
  });

  test('toggling tab visibility hides it from header', async () => {
    const loadPromptsFn = async () => initialData;
    const savePromptsFn = mock(async () => {});
    
    const { lastFrame, stdin } = render(
      <App cwd={mockCwd} loadPromptsFn={loadPromptsFn as any} savePromptsFn={savePromptsFn as any} />
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    // Header should contain "Notes"
    expect(stripAnsi(lastFrame()!)).toContain('Notes');

    // Go to settings
    stdin.write('S');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Move to Notes (index 1)
    stdin.write('j');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Toggle Notes
    stdin.write(' ');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Header should NO LONGER contain "Notes"
    expect(stripAnsi(lastFrame()!)).not.toContain('  Notes  '); 
    
    // Check savePromptsFn call
    expect(savePromptsFn).toHaveBeenCalled();
    const lastCall = (savePromptsFn as any).mock.calls[0][1] as PromptStorageData;
    expect(lastCall.settings.tabVisibility.notes).toBe(false);
  });
});
