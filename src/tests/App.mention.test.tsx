import React from 'react';
import { test, expect, mock } from "bun:test";
import { render } from "ink-testing-library";
import { App } from "../App";

mock.module("../utils/fileSearch", () => ({
  fuzzySearchFiles: async (query: string) => {
    if (query === 'test') {
      return ['src/test.ts', 'src/test2.ts', 'docs/test.md', 'test.txt', 'test_results.txt', 'more_tests.txt'];
    }
    return [];
  }
}));

test("App Mention > shows mention menu and inserts file", async () => {
  const loadPromptsFn = async () => ({
    main: [{ id: "1", text: "Hello", type: "prompt" as const, created_at: "", updated_at: "" }],
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
      },
      slashCommands: [],
    },
  });
  
  const savePromptsFn = mock(async () => {});

  const { lastFrame, stdin } = render(<App cwd="/mock/dir" loadPromptsFn={loadPromptsFn} savePromptsFn={savePromptsFn} viewportSize={5} />);

  // Wait for load
  await new Promise(resolve => setTimeout(resolve, 100));

  // Press Enter to edit prompt "1"
  stdin.write("\r");
  await new Promise(resolve => setTimeout(resolve, 50));

  // Move cursor to end (right arrow 5 times)
  for (let i=0; i<5; i++) {
    stdin.write('\x1b[C');
  }
  
  // Type " @test"
  stdin.write(" ");
  stdin.write("@");
  stdin.write("t");
  stdin.write("e");
  stdin.write("s");
  stdin.write("t");

  // Wait for state updates and search mock
  await new Promise(resolve => setTimeout(resolve, 100));

  let frame = lastFrame();
  expect(frame).toContain("src/test.ts");
  expect(frame).toContain("src/test2.ts");
  expect(frame).toContain("docs/test.md");

  // Navigate down to the second item
  stdin.write("\x1b[B"); // Down arrow
  await new Promise(resolve => setTimeout(resolve, 50));

  // Press Enter to select
  stdin.write("\r");
  await new Promise(resolve => setTimeout(resolve, 50));

  // Check if text was replaced
  frame = lastFrame() || "";
  expect(frame).toContain("Hello @src/test2.ts ");

  // Save changes
  stdin.write("\x13"); // Ctrl+s
  await new Promise(resolve => setTimeout(resolve, 50));

  expect(savePromptsFn).toHaveBeenCalled();
});
