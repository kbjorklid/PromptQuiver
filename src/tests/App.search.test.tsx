import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe } from "bun:test";
import { App } from '../App';
import { AppPage } from './pageObjects/AppPage';

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
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts as any} viewportSize={5} />));
    
    await app.waitForTextToAppear('Prompt Alpha');
    
    // Initially all prompts are shown
    app.expectContent('Prompt Alpha');
    app.expectContent('Prompt Beta');
    app.expectContent('Something else');

    // Press / to enter search mode
    await app.startSearch();
    
    // Type 'Prompt'
    await app.type('Prompt');
    
    await app.waitForTextToDisappear('Something else');
    app.expectContent('Prompt Alpha');
    app.expectContent('Prompt Beta');
    app.expectNotContent('Something else');

    // Refine to 'Alpha'
    await app.type(' Alpha');
    
    await app.waitForTextToDisappear('Prompt Beta');
    app.expectContent('Prompt Alpha');
    app.expectNotContent('Prompt Beta');
    app.expectNotContent('Something else');

    // Press Enter to confirm (should keep filter)
    await app.confirm();
    
    await app.wait(50);
    app.expectContent('Prompt Alpha');
    app.expectNotContent('Prompt Beta');
    app.expectNotContent('Something else');

    // Press Esc to clear filter
    await app.cancel();
    
    await app.waitForTextToAppear('Something else');
    app.expectContent('Prompt Alpha');
    app.expectContent('Prompt Beta');
    app.expectContent('Something else');
  });

  test('enters and exits search mode with / and Esc', async () => {
    const app = new AppPage(render(<App cwd={mockCwd} loadPromptsFn={mockLoadPrompts as any} viewportSize={5} />));
    await app.waitForTextToAppear('Prompt Alpha');

    // Press / to enter search mode
    await app.startSearch();
    
    // Type unique string
    await app.type('UNIQUE_SEARCH');
    await app.waitForTextToAppear('UNIQUE_SEARCH');
    app.expectContent('UNIQUE_SEARCH');

    // Press Esc to exit search mode and clear query
    await app.cancel();
    
    await app.waitForTextToDisappear('UNIQUE_SEARCH');
    app.expectNotContent('UNIQUE_SEARCH');
  });
});
