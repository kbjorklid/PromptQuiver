# promptcue Specification

**promptcue** is a Terminal User Interface (TUI) application designed to help users manage a queue of prompts for AI agents. It allows users to write and organize future "roads" for an AI while it is busy processing current tasks.

## Tech Stack
- **Runtime:** Bun
- **UI Framework:** Ink (React-based TUI)
- **Styling:** Vanilla Ink components
- **Storage:** YAML (`js-yaml`)
- **Clipboard:** `clipboardy` or similar Bun-compatible utility

## Data & Persistence
- **Storage Directory:** `~/.promptcue/`
- **Filename Convention:** `prompts-{last-folder-name}-{hash}.yml`
  - `{last-folder-name}`: The name of the current working directory (CWD).
  - `{hash}`: A short unique hash (e.g., 8-character SHA-256) of the **full absolute path** of the CWD to avoid collisions.
  - Example: For `F:\code\promptcue`, the file might be `prompts-promptcue-a1b2c3d4.yml`.
- **Schema:**
  ```yaml
  main:
    - id: string (UUID)
      text: string (multi-line, properly escaped)
      created_at: string (ISO-8601)
      updated_at: string (ISO-8601)
  notes:
    - id: string (UUID)
      text: string
      created_at: string
      updated_at: string
  archive:
    - id: string (UUID)
      text: string
      created_at: string
      updated_at: string
  ```
- **Session Memory:** None. The app always starts on the first prompt of the Prompt list.

## Core Views

### 1. Main List View (Tabs: Prompt / Notes / Archive)
The main interface features a tabbed navigation system. Use `Tab` to cycle between the **Prompt**, **Notes**, and **Archive** lists.

#### UI Layout
- **Tabs:** "Prompt", "Notes", and "Archive" at the top.
- **List Item:** Each item occupies exactly two lines.
  - **Truncation:** Shows the first two non-empty lines of the text.
  - **Ellipsis:** Lines are truncated with `...` if they exceed the terminal width.
- **Selection:** One item is always highlighted/selected.
  - **Navigation:** Arrow keys (`Up`/`Down`) or Vim keys (`j`/`k`).
  - **Scrolling:** The list scrolls to keep the selected item centered in the viewport.
- **Empty State:** Centered text "No items yet" when a list is empty.
- **Visual Cues:**
  - The first prompt in the Prompt list has a subtle visual indicator (e.g., a colored border or prefix) to denote it is the target for the "Process" (`N`) command.

#### Keyboard Shortcuts (Prompt List)
- `e` or `Enter`: Open Editor for the selected prompt.
- `y`: Yank (Copy) the selected prompt to the clipboard.
- `a`: Add a new prompt *after* the selected item.
- `A`: Add a new prompt at the *end* of the list.
- `i`: Add a new prompt *before* the selected item.
- `I`: Add a new prompt at the *beginning* of the list.
- `d`: Move the selected prompt to the Archive. (Selection stays at the same index).
- `N`: **Process Prompt** (Copy the first prompt to clipboard AND move it to Archive).
- `u`: Undo the last list operation (full history).
- `Ctrl+y`: Redo the last undone list operation.
- `Tab/h/l`: Switch tabs.

#### Keyboard Shortcuts (Notes List)
- `e` or `Enter`: Open Editor for the selected note.
- `a`: Add a new note *after* the selected item.
- `A`: Add a new note at the *end* of the list.
- `i`: Add a new note *before* the selected item.
- `I`: Add a new note at the *beginning* of the list.
- `d`: Move the selected note to the Archive.
- `u`: Undo.
- `Ctrl+y`: Redo.
- `Tab/h/l`: Switch tabs.
- **Note:** `N` (Process) and `y` (Yank) are disabled for notes.

#### Keyboard Shortcuts (Archive List)
- `d`: Move the selected item back to its original list.
- `X`: Permanent delete.
  - **No Confirmation:** Deletes immediately.
  - **Undo Window:** A 5-second window allows for undoing the deletion using `u`.
- `u`: Undo (including the 5-second permanent delete window).
- `Tab/h/l`: Switch tabs.

### 2. Editor View
A full-screen view for editing a specific prompt.

- **Interface:** A simple multi-line text area.
- **Keyboard Shortcuts:**
  - `Ctrl+s`: Save changes and return to the list view.
  - `Esc`: Cancel changes and return to the list view.

### 3. Feedback System (Toasts)
- **Location:** Floating box at the center-bottom of the terminal.
- **Triggers:**
  - Copying to clipboard ("Copied to clipboard!").
  - Processing prompt (`N`).
  - Moving to Archive.
  - Permanent delete ("Deleted. Press 'u' to undo (5s)").

## Operational Logic
- **Undo/Redo:** Strictly tracks list operations (adding, moving, deleting, reordering). It does not track character-level text editing inside the Editor view, but should track the "Save" action as a state change.
- **Selection Stability:** When moving or deleting an item, the selection cursor should remain at the same index if possible (clamped to the new list length).
- **YAML Safety:** Multi-line strings must be stored using YAML literal blocks (`|`) or properly escaped to handle special characters (quotes, backslashes, etc.).

## Installation & Usage
- The app should be runnable via `bun start`.
- On first run, it should create the `~/.promptcue/` directory and an empty `prompts.yml` if they don't exist.

## Iteration Plan

### Iteration 1: Foundation & Storage (DONE)
- [x] Initialize Bun project and install dependencies (Ink, React, js-yaml, uuid, clipboardy).
- [x] Implement storage logic with YAML serialization/deserialization.
- [x] Implement filename hashing based on CWD (`prompts-{last-folder-name}-{hash}.yml`).
- [x] Verify storage with unit tests.

### Iteration 2: Basic Navigation & State Management (DONE)
- [x] Create the core Ink application structure.
- [x] Implement Tab navigation (Main vs. Archive).
- [x] Implement list rendering with selection (Up/Down/Vim keys).
- [x] Implement selection stability logic.

### Iteration 3: CRUD & Keyboard Shortcuts (DONE)
- [x] Implement adding prompts (`a`, `A`, `i`, `I`).
- [x] Implement archiving (`x`) and deleting (`X`).
- [x] Implement the Editor View (multi-line text area).

### Iteration 4: Advanced Logic (Undo/Redo & "Process") (DONE)
- [x] Implement the "Process Prompt" (`N`) command.
- [x] Implement full undo/redo history for list operations.
- [x] Implement the 5-second undo window for permanent deletions.

### Iteration 5: UI Polish & Feedback (DONE)
- [x] Implement the Toast feedback system.
- [x] Implement line truncation and ellipsis.
- [x] Add visual cues (borders, highlight colors).
- [x] Final end-to-end verification.

### Iteration 6: UI Enhancement with Community Components (DONE)
- [x] Install and integrate `ink-tab` for Main/Archive navigation.
- [x] Replace the manual editor input with `ink-text-input` for a better editing experience.
- [x] Integrate `ink-spinner` for loading states.
- [x] Enhance application branding with `ink-gradient` and `ink-big-text` for the header.
- [x] Use `ink-link` for documentation/help links.
- [x] Re-verify all keyboard shortcuts and state management with the new components.

