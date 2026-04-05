import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../App';
import { test, expect, mock } from 'bun:test';
import type { PromptStorageData } from '../storage';

const mockCwd = '/test/cwd';

const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1b\][0-9;]*\x07/g, '');

test('Slash Command: Settings > Autocomplete', async () => {
  const initialData: PromptStorageData = {
    main: [{ id: "1", text: "Fix this", type: "prompt" as const, created_at: "", updated_at: "" }],
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
      },
      slashCommands: []
    }
  };

  const loadPromptsFn = async () => initialData;
  const savePromptsFn = mock(async () => {});

  const { lastFrame, stdin } = render(<App cwd={mockCwd} loadPromptsFn={loadPromptsFn as any} savePromptsFn={savePromptsFn as any} viewportSize={5} />);

  // Wait for load
  await new Promise(resolve => setTimeout(resolve, 200));

  // Go to Settings tab
  stdin.write('S');
  await new Promise(resolve => setTimeout(resolve, 200));

  // Verify we are in settings
  expect(stripAnsi(lastFrame()!)).toContain('Tab Visibility');

  // Switch to Slash Commands section (down arrow multiple times)
  for (let i = 0; i < 7; i++) {
    stdin.write('j');
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(stripAnsi(lastFrame()!)).toContain('Slash Command Suggestions');
  
  // Select "Add New Command" and press Enter to start adding
  stdin.write('\r');
  await new Promise(resolve => setTimeout(resolve, 100));

  // Type "fix-bug" (slash is already there)
  for (const char of "fix-bug") {
      stdin.write(char);
      await new Promise(resolve => setTimeout(resolve, 20));
  }
  
  // Press Enter to add
  stdin.write('\r');
  await new Promise(resolve => setTimeout(resolve, 300));

  // Verify it was added to the list and saved
  let frame = stripAnsi(lastFrame()!);
  expect(frame).toContain('/fix-bug');
  expect(savePromptsFn).toHaveBeenCalled();
  
  const lastData = (savePromptsFn as any).mock.calls[(savePromptsFn as any).mock.calls.length - 1][1] as PromptStorageData;
  expect(lastData.settings?.slashCommands).toContain('fix-bug');

  // Now go back to Main tab (1) and use it
  stdin.write('1');
  await new Promise(resolve => setTimeout(resolve, 200));
  expect(stripAnsi(lastFrame()!)).toContain('1. Prompt');

  // Press Enter to edit prompt "1"
  stdin.write('\r');
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(stripAnsi(lastFrame()!)).toContain('Editor');

  // Move cursor to end (right arrow many times)
  for (let i=0; i<10; i++) stdin.write('\x1b[C');

  // Type " /fix"
  stdin.write(' ');
  stdin.write('/');
  stdin.write('f');
  stdin.write('i');
  stdin.write('x');
  
  await new Promise(resolve => setTimeout(resolve, 200));

  // Verify autocomplete shows /fix-bug
  frame = stripAnsi(lastFrame()!);
  expect(frame).toContain('fix-bug');

  // Press Enter to select
  stdin.write('\r');
  await new Promise(resolve => setTimeout(resolve, 100));

  // Verify text was inserted
  frame = stripAnsi(lastFrame()!);
  expect(frame).toContain('Fix this /fix-bug ');
});
