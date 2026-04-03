import React from 'react';
import { render } from 'ink-testing-library';
import { PromptList } from '../components/PromptList';
import { expect, test, describe } from 'bun:test';
import type { Prompt } from '../storage/paths';

const createPrompt = (id: string, text: string, type: 'prompt' | 'note' = 'prompt'): Prompt => ({
  id,
  text,
  type,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

describe('PromptList', () => {
  const mockPrompts = [
    createPrompt('1', 'Prompt 1'),
    createPrompt('2', 'Prompt 2'),
    createPrompt('3', 'Prompt 3'),
    createPrompt('4', 'Prompt 4'),
    createPrompt('5', 'Prompt 5'),
  ];

  const terminalSize = { columns: 80, rows: 20 };

  test('renders empty state', () => {
    const { lastFrame } = render(
      <PromptList currentList={[]} selectedIndex={0} isMoving={false} terminalSize={terminalSize} />
    );
    expect(lastFrame()?.includes('No items yet')).toBe(true);
  });

  test('renders full viewport when list is small', () => {
    const { lastFrame } = render(
      <PromptList 
        currentList={mockPrompts.slice(0, 3)} 
        selectedIndex={0} 
        isMoving={false} 
        terminalSize={terminalSize} 
        initialViewportSize={5} 
      />
    );
    expect(lastFrame()?.includes('Prompt 1')).toBe(true);
    expect(lastFrame()?.includes('Prompt 2')).toBe(true);
    expect(lastFrame()?.includes('Prompt 3')).toBe(true);
  });

  test('handles viewport scrolling - top selection', () => {
    const { lastFrame } = render(
      <PromptList 
        currentList={mockPrompts} 
        selectedIndex={0} 
        isMoving={false} 
        terminalSize={terminalSize} 
        initialViewportSize={3} 
      />
    );
    // Should show 1, 2, 3
    expect(lastFrame()?.includes('Prompt 1')).toBe(true);
    expect(lastFrame()?.includes('Prompt 3')).toBe(true);
    expect(lastFrame()?.includes('Prompt 4')).toBe(false);
  });

  test('handles viewport scrolling - middle selection', () => {
    const { lastFrame } = render(
      <PromptList 
        currentList={mockPrompts} 
        selectedIndex={2} // Index 2 is "Prompt 3"
        isMoving={false} 
        terminalSize={terminalSize} 
        initialViewportSize={3} 
      />
    );
    // Half of 3 is 1. Start = 2 - 1 = 1. End = 1 + 3 = 4. 
    // Indices 1, 2, 3 should be shown (Prompt 2, 3, 4)
    expect(lastFrame()?.includes('Prompt 1')).toBe(false);
    expect(lastFrame()?.includes('Prompt 2')).toBe(true);
    expect(lastFrame()?.includes('Prompt 3')).toBe(true);
    expect(lastFrame()?.includes('Prompt 4')).toBe(true);
    expect(lastFrame()?.includes('Prompt 5')).toBe(false);
  });

  test('handles viewport scrolling - bottom selection', () => {
    const { lastFrame } = render(
      <PromptList 
        currentList={mockPrompts} 
        selectedIndex={4} // Index 4 is "Prompt 5"
        isMoving={false} 
        terminalSize={terminalSize} 
        initialViewportSize={3} 
      />
    );
    // Should show 3, 4, 5
    expect(lastFrame()?.includes('Prompt 2')).toBe(false);
    expect(lastFrame()?.includes('Prompt 3')).toBe(true);
    expect(lastFrame()?.includes('Prompt 4')).toBe(true);
    expect(lastFrame()?.includes('Prompt 5')).toBe(true);
  });

  test('shows different indicators for moving mode', () => {
    const { lastFrame, rerender } = render(
      <PromptList currentList={mockPrompts} selectedIndex={0} isMoving={false} terminalSize={terminalSize} />
    );
    expect(lastFrame()?.includes('▶')).toBe(true);
    expect(lastFrame()?.includes('↕')).toBe(false);

    rerender(
      <PromptList currentList={mockPrompts} selectedIndex={0} isMoving={true} terminalSize={terminalSize} />
    );
    expect(lastFrame()?.includes('↕')).toBe(true);
    expect(lastFrame()?.includes('▶')).toBe(false);
  });
});
