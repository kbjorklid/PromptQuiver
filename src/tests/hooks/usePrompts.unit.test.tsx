import React, { useState, useEffect } from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe } from 'bun:test';
import { usePrompts } from '../../hooks/usePrompts';
import type { PromptStorageData } from '../../storage';

const mockData: PromptStorageData = {
  main: [
    { id: '1', text: 'Prompt 1', type: 'prompt', created_at: '2023-01-01', updated_at: '2023-01-01' },
  ],
  notes: [],
  archive: [],
  canned: [],
  snippets: [],
};

const renderHook = <P, R>(hookFn: (props: P) => R, initialProps: P) => {
  let result = { current: null as R };
  
  const TestComponent = ({ props }: { props: P }) => {
    result.current = hookFn(props);
    return null;
  };

  const { rerender } = render(<TestComponent props={initialProps} />);

  return {
    result,
    rerender: (newProps: P) => rerender(<TestComponent props={newProps} />)
  };
};

describe('usePrompts Hook (Unit)', () => {
  test('loads initial data', async () => {
    const { result } = renderHook(usePrompts, {
      cwd: '/test',
      loadPromptsFn: async () => JSON.parse(JSON.stringify(mockData)),
      savePromptsFn: async () => {},
    });
    
    // Wait for load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(result.current.data.main).toHaveLength(1);
    expect(result.current.data.main[0].text).toBe('Prompt 1');
    expect(result.current.isLoading).toBe(false);
  });

  test('undo/redo functionality', async () => {
     const { result } = renderHook(usePrompts, {
      cwd: '/test',
      loadPromptsFn: async () => JSON.parse(JSON.stringify(mockData)),
      savePromptsFn: async () => {},
    });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const initialData = result.current.data;
    
    // Perform an operation (pushState)
    const nextData = JSON.parse(JSON.stringify(initialData));
    nextData.main.push({ id: '2', text: 'Prompt 2', type: 'prompt', created_at: 'now', updated_at: 'now' });
    
    result.current.pushState(nextData);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(result.current.data.main).toHaveLength(2);
    
    // Undo
    result.current.undo();
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(result.current.data.main).toHaveLength(1);
    
    // Redo
    result.current.redo();
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(result.current.data.main).toHaveLength(2);
  });

  test('searching filters currentList', async () => {
    const { result } = renderHook(usePrompts, {
      cwd: '/test',
      loadPromptsFn: async () => ({
        main: [
          { id: '1', text: 'Apple', type: 'prompt', created_at: 'now', updated_at: 'now' },
          { id: '2', text: 'Banana', type: 'prompt', created_at: 'now', updated_at: 'now' },
        ],
        notes: [], archive: [], canned: [], snippets: []
      }),
      savePromptsFn: async () => {},
    });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(result.current.currentList).toHaveLength(2);
    
    result.current.setSearchQuery('App');
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(result.current.currentList).toHaveLength(1);
    expect(result.current.currentList[0].text).toBe('Apple');
  });

  test('tab switching', async () => {
    const { result } = renderHook(usePrompts, {
      cwd: '/test',
      loadPromptsFn: async () => ({
        main: [{ id: '1', text: 'P1', type: 'prompt', created_at: 'now', updated_at: 'now' }],
        notes: [{ id: '2', text: 'N1', type: 'note', created_at: 'now', updated_at: 'now' }],
        archive: [], canned: [], snippets: []
      }),
      savePromptsFn: async () => {},
    });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(result.current.activeTab).toBe('main');
    expect(result.current.currentList[0].text).toBe('P1');
    
    result.current.setActiveTab('notes');
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(result.current.activeTab).toBe('notes');
    expect(result.current.currentList[0].text).toBe('N1');
  });
});
