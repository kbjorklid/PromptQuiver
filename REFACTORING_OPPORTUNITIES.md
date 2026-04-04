# Top 3 Refactoring Opportunities for promptcue

This document outlines the highest-impact refactoring opportunities identified in the `promptcue` codebase to improve maintainability, testability, and architectural clarity.

## 1. Decompose the `usePrompts` "God Hook"

### Context
`src/hooks/usePrompts.ts` (11.3 KB)

### Problem
The `usePrompts` hook has become a "God Hook," violating the Single Responsibility Principle. It currently manages:
- **Core Data:** Loading and saving prompts.
- **Undo/Redo History:** Managing the history and future stacks.
- **UI State:** Active tab, selected indices, searching/moving modes, and toast messages.
- **Operations Logic:** Complex logic for adding, moving, deleting, and editing prompts.
- **Git Integration:** Branch filtering logic.

### Recommendation
Split `usePrompts` into smaller, specialized hooks:
- `usePromptData`: Handles CRUD operations and persistence.
- `useUndoRedo`: A generic hook for managing history/future state.
- `usePromptUI`: Manages tab selection, list indices, and search/mode state.
- `useBranchFilter`: Specifically handles Git branch detection and filtering.

---

## 2. Reducer-based State Management for Core Logic

### Context
`src/hooks/usePrompts.ts`

### Problem
The application uses multiple `useState` calls to manage related pieces of state. The `pushState` function manually manages the `history` and `future` stacks alongside the current `data`. This approach is error-prone, makes atomic updates difficult, and complicates testing of complex state transitions (like undo/redo or moving items between lists).

### Recommendation
Implement a `useReducer` to manage the core application state (prompts and history).
- Define a clear set of actions (e.g., `ADD_PROMPT`, `MOVE_PROMPT`, `UNDO`, `REDO`).
- Centralize the logic for history management within the reducer.
- **Benefit:** This makes the core logic pure, highly testable in isolation, and ensures that state transitions are predictable and atomic.

---

## 3. Extract Autocomplete Logic from `EditorView`

### Context
`src/components/EditorView.tsx` (12.4 KB)

### Problem
`EditorView.tsx` is the largest component in the project. It is currently bloated because it contains all the logic for the "Mention/Autocomplete" system (detecting `@`, `$`, and `$$` prefixes, performing fuzzy searches for files and snippets, and managing the selection in the autocomplete popup).

### Recommendation
Extract this logic into a custom hook called `useMentionAutocomplete`.
- The hook should take the current text and cursor position as input.
- It should return the search results, the current selection index, and a function to apply the selected result to the text.
- **Benefit:** This significantly reduces the complexity of `EditorView.tsx`, makes the autocomplete logic reusable for other input fields, and allows for thorough unit testing of the mention detection and search logic.
