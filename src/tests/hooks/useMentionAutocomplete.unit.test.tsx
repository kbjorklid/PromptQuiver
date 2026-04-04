import React from 'react';
import { render } from 'ink-testing-library';
import { expect, test, describe, mock } from 'bun:test';
import { useMentionAutocomplete } from '../../hooks/useMentionAutocomplete';
import type { Prompt } from '../../storage/paths';

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

mock.module("../../utils/fileSearch", () => ({
  fuzzySearchFiles: async (query: string) => {
    if (query.includes('te')) {
      return ['src/test.ts', 'src/test2.ts'];
    }
    return [];
  }
}));

describe('useMentionAutocomplete Hook', () => {
  const snippets: Prompt[] = [
    { id: 's1', name: 'ask', text: 'Ask me questions', type: 'prompt', created_at: '', updated_at: '' }
  ];

  test('detects file mention', async () => {
    const onApply = mock(() => {});
    const { result } = renderHook(useMentionAutocomplete, { snippets, onApply });

    result.current.checkMention('Hello @te', 9);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(result.current.mentionType).toBe('file');
    expect(result.current.mentionQuery).toBe('te');
    expect(result.current.searchResults).toContain('src/test.ts');
  });

  test('detects snippet expand mention', async () => {
    const onApply = mock(() => {});
    const { result } = renderHook(useMentionAutocomplete, { snippets, onApply });

    result.current.checkMention('Hello $as', 9);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(result.current.mentionType).toBe('snippet-expand');
    expect(result.current.mentionQuery).toBe('as');
    expect(result.current.searchResults).toContain('ask');
  });

  test('detects snippet var mention', async () => {
    const onApply = mock(() => {});
    const { result } = renderHook(useMentionAutocomplete, { snippets, onApply });

    result.current.checkMention('Hello $$as', 10);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(result.current.mentionType).toBe('snippet-var');
    expect(result.current.mentionQuery).toBe('as');
    expect(result.current.searchResults).toContain('ask');
  });

  test('handles keyboard navigation and selection', async () => {
    const onApply = mock(() => {});
    const { result } = renderHook(useMentionAutocomplete, { snippets, onApply });

    result.current.checkMention('@test', 5);
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.searchResults).toHaveLength(2);
    expect(result.current.selectedIndex).toBe(0);

    // Down arrow
    result.current.handleInterceptKey(undefined, { downArrow: true });
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(result.current.selectedIndex).toBe(1);

    // Return (select second item)
    result.current.handleInterceptKey(undefined, { return: true });
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(onApply).toHaveBeenCalledWith('@src/test2.ts ', 0, 5);
    expect(result.current.mentionQuery).toBeNull();
  });

  test('handles escape to close', async () => {
    const onApply = mock(() => {});
    const { result } = renderHook(useMentionAutocomplete, { snippets, onApply });

    result.current.checkMention('@test', 5);
    await new Promise(resolve => setTimeout(resolve, 100));

    result.current.handleInterceptKey(undefined, { escape: true });
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(result.current.mentionQuery).toBeNull();
  });
});
