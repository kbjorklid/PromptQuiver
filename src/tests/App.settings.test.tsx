import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../App';
import { describe, test, expect, mock, beforeEach } from 'bun:test';
import type { PromptStorageData } from '../storage';

const mockCwd = '/test/cwd';

const stripAnsi = (str: string) => str.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');

describe('App Settings', () => {
  const initialData: PromptStorageData = {
    main: [{ id: '1', text: 'Main Prompt', type: 'prompt', created_at: '', updated_at: '' }],
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

  test('footer shows settings shortcuts when in settings', async () => {
    const loadPromptsFn = async () => initialData;
    const { lastFrame, stdin } = render(
      <App cwd={mockCwd} loadPromptsFn={loadPromptsFn as any} />
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    // Initially should show default shortcuts (e.g., [Enter/e] Edit)
    expect(stripAnsi(lastFrame()!)).toContain('[Enter/e]');
    expect(stripAnsi(lastFrame()!)).toContain('Edit');

    // Press S to go to settings
    stdin.write('S');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should show settings shortcuts (e.g., [←/→/h/l] Section)
    const frame = stripAnsi(lastFrame()!);
    expect(frame).toContain('[←/→/h/l]');
    expect(frame).toContain('Section');
    expect(frame).toContain('[Enter/Space]');
    expect(frame).toContain('Action');
    
    // Should NOT show default shortcuts (like [Enter/e] Edit)
    expect(frame).not.toContain('Edit');
    expect(frame).not.toContain('[Enter/e]');
  });

  test('undo works in settings', async () => {
    const loadPromptsFn = async () => initialData;
    const savePromptsFn = mock(async () => {});
    
    const { lastFrame, stdin } = render(
      <App cwd={mockCwd} loadPromptsFn={loadPromptsFn as any} savePromptsFn={savePromptsFn as any} />
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    // Go to settings
    stdin.write('S');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Toggle Notes (index 1)
    stdin.write('j');
    await new Promise(resolve => setTimeout(resolve, 50));
    stdin.write(' ');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Notes should be hidden
    expect(stripAnsi(lastFrame()!)).not.toContain('  Notes  ');

    // Press 'u' to undo
    stdin.write('u');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Notes should be back
    expect(stripAnsi(lastFrame()!)).toContain('Notes');
  });
});
