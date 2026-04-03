# Top 5 Refactoring Opportunities for promptcue

This document outlines the top 5 refactoring opportunities to improve the maintainability, readability, and scalability of the `promptcue` codebase.

## 1. Extract Business Logic into `usePrompts` Custom Hook
**File:** `src/App.tsx`

The `App` component currently manages too much state and complex business logic, including undo/redo history, CRUD operations, item movement, and filtering.

**Benefits:**
- **Separation of Concerns:** Decouples state management from UI rendering.
- **Testability:** Makes it easier to unit test the business logic in isolation without rendering the entire UI.
- **Maintainability:** Reduces the size of `App.tsx`, making it easier to navigate.

## 2. Decompose `App.tsx` into Sub-components
**File:** `src/App.tsx`

The `App` component's `render` method contains significant layout logic for the header (tabs), the main list view (scrolling/viewport), and the footer (keyboard shortcuts).

**Recommended Components:**
- `Header`: Manages tab rendering and the application title.
- `PromptList`: Handles the viewport calculation and rendering of individual items.
- `Footer`: Displays current keyboard shortcuts and status messages (toasts).
- `SearchInput`: Encapsulates the search bar logic.

## 3. Refactor Keyboard Input Handling
**File:** `src/App.tsx`, `src/components/EditorView.tsx`

The `useInput` hooks are currently large blocks of `if/else` or `switch` statements. This makes it difficult to see which keys map to which actions and leads to duplication.

**Benefits:**
- **Command Pattern:** Implementing a mapping of keys to command functions improves readability.
- **Configurability:** Makes it easier to support user-configurable keybindings in the future.
- **Dryness:** Centralizes common key handlers (like escape to exit or arrows for navigation).

## 4. Extract Viewport/Pagination Logic into `useViewport` Hook
**File:** `src/App.tsx`

The logic for calculating `start` and `end` indices for the visible items in the list view is currently mixed with the rendering loop.

**Benefits:**
- **Reusability:** This logic is useful for any list-based view in the TUI.
- **Clarity:** Separates the mathematical calculation of "what's visible" from the visual representation of "how it's rendered".

## 5. Standardize Persistence and Auto-save
**File:** `src/App.tsx`, `src/storage/index.ts`

The auto-save logic is currently implemented as a `useEffect` inside `App.tsx`, which relies on `isLoading` and `data` changes.

**Benefits:**
- **Robustness:** Moving this into the custom hook or a dedicated `DataService` ensures that saves happen consistently regardless of UI state.
- **Abstraction:** The UI shouldn't need to know *when* or *how* data is persisted; it should just interact with a state manager that handles persistence transparently.
