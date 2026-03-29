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
  archive:
    - id: string (UUID)
      text: string
      created_at: string
      updated_at: string
  ```
- **Session Memory:** None. The app always starts on the first prompt of the Main list.

## Core Views

### 1. Main List View (Tabs: Main / Archive)
The main interface features a tabbed navigation system. Use `Tab` to switch between the **Main** and **Archive** lists.

#### UI Layout
- **Tabs:** "Main" and "Archive" at the top.
- **List Item:** Each prompt occupies exactly two lines.
  - **Truncation:** Shows the first two non-empty lines of the prompt text.
  - **Ellipsis:** Lines are truncated with `...` if they exceed the terminal width.
- **Selection:** One prompt is always highlighted/selected.
  - **Navigation:** Arrow keys (`Up`/`Down`) or Vim keys (`j`/`k`).
  - **Scrolling:** The list scrolls to keep the selected item centered in the viewport.
- **Empty State:** Centered text "No prompts yet" when a list is empty.
- **Visual Cues:**
  - The first prompt in the Main list has a subtle visual indicator (e.g., a colored border or prefix) to denote it is the target for the "Process" (`N`) command.

#### Keyboard Shortcuts (Main List)
- `e` or `Enter`: Open Editor for the selected prompt.
- `c`: Copy the selected prompt to the clipboard.
- `a`: Add a new prompt *after* the selected item.
- `A`: Add a new prompt at the *end* of the list.
- `i`: Add a new prompt *before* the selected item.
- `I`: Add a new prompt at the *beginning* of the list.
- `x`: Move the selected prompt to the Archive. (Selection stays at the same index).
- `N`: **Process Prompt** (Copy the first prompt to clipboard AND move it to Archive).
- `u`: Undo the last list operation (full history).
- `Ctrl+y`: Redo the last undone list operation.
- `Tab`: Switch to Archive tab.

#### Keyboard Shortcuts (Archive List)
- `x`: Move the selected prompt back to the Main list (as the last item).
- `X`: Permanent delete.
  - **No Confirmation:** Deletes immediately.
  - **Undo Window:** A 5-second window allows for undoing the deletion using `u`.
- `u`: Undo (including the 5-second permanent delete window).
- `Tab`: Switch back to Main tab.

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
