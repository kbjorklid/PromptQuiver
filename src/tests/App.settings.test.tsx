import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../App';
import { describe, test, expect, mock } from 'bun:test';
import type { PromptStorageData } from '../storage';
import { AppPage } from './pageObjects/AppPage';

const mockCwd = '/test/cwd';

describe('App Settings', () => {
  const initialData: PromptStorageData = {
    main: [{ id: '1', text: 'Main Prompt', type: 'prompt', created_at: '', updated_at: '' }],
    canned: [],
    notes: [],
    snippets: [],
    archive: [],
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
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={loadPromptsFn as any} viewportSize={5} />));

    await app.waitForTextToAppear('Prompt');

    // Press ctrl-s (Save in editor, but in list it opens settings? Actually Ctrl-S opens settings if not in editor)
    await app.save();
    
    await app.waitForTextToAppear('Tab Visibility');
    app.expectContent('Tab Visibility');
  });

  test('toggling tab visibility hides it from header', async () => {
    const loadPromptsFn = async () => initialData;
    const savePromptsFn = mock(async () => {});
    
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={loadPromptsFn as any} savePromptsFn={savePromptsFn as any} viewportSize={5} />));

    await app.waitForTextToAppear('Notes');

    // Go to settings
    await app.goToSettings();
    await app.waitForTextToAppear('Tab Visibility');

    // Move to Notes (index 2 in settings list)
    // 0: main, 1: canned, 2: notes
    await app.navigateDown();
    await app.navigateDown();
    
    // Toggle Notes
    await app.toggleItem();

    // Header should NO LONGER contain "Notes"
    await app.waitForTextToDisappear('  Notes  '); 
    
    // Check savePromptsFn call
    expect(savePromptsFn).toHaveBeenCalled();
    const lastCall = (savePromptsFn as any).mock.calls[0][1] as PromptStorageData;
    expect(lastCall.settings.tabVisibility.notes).toBe(false);
  });

  test('footer shows settings shortcuts when in settings', async () => {
    const loadPromptsFn = async () => initialData;
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={loadPromptsFn as any} viewportSize={5} />));

    await app.waitForTextToAppear('Edit');

    // Initially should show default shortcuts (e.g., [Enter/e] Edit)
    app.expectContent('[Enter/e]');
    app.expectContent('Edit');

    // Press S to go to settings
    await app.goToSettings();
    await app.waitForTextToAppear('Tab Visibility');

    // Should show settings shortcuts (e.g., [Tab/←/→/h/l] Tab)
    app.expectContent('[Tab/←/→/h/l]');
    app.expectContent('Tab');
    app.expectContent('[Enter/Space]');
    app.expectContent('Action');
    
    // Should NOT show default shortcuts (like [Enter/e] Edit)
    app.expectNotContent('Edit');
    app.expectNotContent('[Enter/e]');
  });

  test('undo works in settings', async () => {
    const loadPromptsFn = async () => initialData;
    const savePromptsFn = mock(async () => {});
    
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={loadPromptsFn as any} savePromptsFn={savePromptsFn as any} viewportSize={5} />));

    await app.waitForTextToAppear('Notes');

    // Go to settings
    await app.goToSettings();
    await app.waitForTextToAppear('Tab Visibility');

    // Toggle Notes (it is index 2 actually if order is main, canned, notes)
    // Wait, initialData has them all true. 
    // In SettingsView.tsx: ALL_TABS: Tab[] = ['main', 'canned', 'notes', 'snippets', 'archive', 'settings'];
    await app.navigateDown();
    await app.navigateDown();
    await app.toggleItem();

    // Notes should be hidden
    await app.waitForTextToDisappear('  Notes  ');

    // Press 'u' to undo
    await app.undo();

    // Notes should be back
    await app.waitForTextToAppear('Notes');
    app.expectContent('Notes');
  });

  test('left/right arrows switch tabs while in settings', async () => {
    const loadPromptsFn = async () => initialData;
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={loadPromptsFn as any} viewportSize={5} />));

    await app.waitForTextToAppear('Prompt');

    // Go to settings
    await app.goToSettings();
    await app.waitForTextToAppear('Settings');
    app.expectContent('Settings');

    // Press left arrow
    await app.arrowLeft();
    
    // Should be on Archive (the tab before Settings)
    await app.waitForTextToAppear('Archive');
    app.expectContent('Archive');
    app.expectNotContent('Tab Visibility');

    // Press right arrow
    await app.arrowRight();
    
    // Should be back on Settings
    await app.waitForTextToAppear('Tab Visibility');
    app.expectContent('Tab Visibility');
  });
});
