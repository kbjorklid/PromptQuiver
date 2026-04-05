import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe } from "bun:test";
import { App } from '../App';
import { AppPage } from './pageObjects/AppPage';

const mockData = {
  main: [],
  canned: [],
  notes: [],
  snippets: [],
  archive: [
    { id: '1', text: 'Archived Prompt', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
};

const mockLoadPrompts = async () => JSON.parse(JSON.stringify(mockData));

describe('App Archive Delete Confirmation', () => {
  const mockCwd = '/test/path';

  test('Pressing d in archive should show confirmation dialog', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
    await app.waitForTextToAppear('Archive');
    
    await app.switchTab('archive');
    await app.waitForTextToAppear('Archived Prompt');

    // Press 'd' to delete
    await app.deletePrompt();
    
    await app.waitForTextToAppear('Permanently delete this prompt?');
    app.expectContent('Yes');
    app.expectContent('No');
  });

  test('Confirming deletion with Yes should remove the prompt', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
    await app.waitForTextToAppear('Archive');
    
    await app.switchTab('archive');
    await app.waitForTextToAppear('Archived Prompt');
    
    await app.deletePrompt();
    await app.waitForTextToAppear('Permanently delete this prompt?');

    // Yes is default, press Enter
    await app.confirm();
    
    await app.waitForTextToDisappear('Archived Prompt');
    app.expectContent('Deleted');
  });

  test('Cancelling deletion with No should keep the prompt', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
    await app.waitForTextToAppear('Archive');
    
    await app.switchTab('archive');
    await app.waitForTextToAppear('Archived Prompt');
    
    await app.deletePrompt();
    await app.waitForTextToAppear('Permanently delete this prompt?');

    // Select 'No' (Right arrow)
    await app.arrowRight();
    await app.confirm();

    await app.waitForTextToAppear('Archived Prompt');
    app.expectNotContent('Deleted');
  });

  test('Escape should also cancel the deletion', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts} viewportSize={5} />));
    await app.waitForTextToAppear('Archive');
    
    await app.switchTab('archive');
    await app.waitForTextToAppear('Archived Prompt');
    
    await app.deletePrompt();
    await app.waitForTextToAppear('Permanently delete this prompt?');

    await app.cancel();

    await app.waitForTextToAppear('Archived Prompt');
    app.expectNotContent('Permanently delete this prompt?');
  });
});

