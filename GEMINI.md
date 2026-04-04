# Prompt Quiver

`Prompt Quiver` is a Terminal User Interface (TUI) application designed to help users manage a queue of prompts for AI agents. It allows users to write and organize future "roads" for an AI while it is busy processing current tasks.

## Project Overview

- **Main Technologies:** [Bun](https://bun.sh/) runtime, [React](https://reactjs.org/), and [Ink](https://github.com/vadimdemedes/ink) for the TUI.
- **Architecture:** 
  - **View Layer:** React components using Ink for terminal rendering.
  - **State Management:** Functional state within `src/App.tsx` with a custom undo/redo history stack.
  - **Persistence:** YAML-based storage using `js-yaml`. Files are stored in `~/.promptquiver/` with a filename derived from the current working directory's absolute path hash.
  - **Testing:** Comprehensive test suite using Bun's built-in test runner and `ink-testing-library`.

## Building and Running

### Prerequisites
- [Bun](https://bun.sh/) installed on your system.

### Key Commands
- **Install Dependencies:** `bun install`
- **Run Application:** `bun start` (aliases to `bun index.tsx`)
- **Run Tests:** `bun test src/tests`
- **Type Check:** `tsc --noEmit` (inferred from `tsconfig.json`)

## Development Conventions

### Coding Style
- **TypeScript:** The project is strictly typed. Always use TypeScript and provide interfaces/types for new data structures.
- **Functional Components:** Use React functional components and hooks (`useState`, `useEffect`, `useCallback`, `useRef`).
- **TUI Layout:** Use Ink's `<Box>` and `<Text>` components for layout and styling. **Always consult `INK_COMPONENTS.md` before deciding on a component to use**, as it contains a curated list of both core and community components that can enhance the UI.
- **State Updates:** For list operations, use the `pushState` function in `App.tsx` to ensure the operation is recorded in the undo/redo history.

### Testing Practices
- **Test Location:** All tests are located in `src/tests/`.
- **Test Runner:** Use `bun test`.
- **UI Testing:** Use `ink-testing-library` to simulate user input (`stdin.write`) and verify terminal output (`lastFrame()`).
- **Mocking:** Mock storage operations (`loadPromptsFn`, `savePromptsFn`) when testing the UI to avoid side effects.
- **Mandate:** Always add a new test case for bug fixes or new features, as specified in the global context.

### Storage & Schema
- **Data Location:** `~/.promptquiver/prompts-{cwd-basename}-{cwd-hash}.yml`.
- **YAML Format:** Uses YAML literal blocks (`|`) for multi-line prompt text to ensure readability and safety.
- **Schema:**
  ```yaml
  main: Array<Prompt>
  notes: Array<Prompt>
  archive: Array<Prompt>
  ```
- **Prompt Object:**
  ```typescript
  {
    id: string; // UUID v4
    text: string;
    type: 'prompt' | 'note';
    branch?: string;
    created_at: string; // ISO-8601;
    updated_at: string; // ISO-8601;
  }
  ```

## Key Files
- `index.tsx`: Application entry point.
- `src/App.tsx`: Root component containing the main logic, state, and keyboard event handlers.
- `src/storage/index.ts`: Handles loading and saving prompt data to YAML.
- `src/components/EditorView.tsx`: Full-screen multi-line text editor.
- `PROMPT_QUIVER_SPEC.md`: Detailed functional specification and keyboard shortcut reference.
- `INK_COMPONENTS.md`: Reference for Ink components used in the project.
