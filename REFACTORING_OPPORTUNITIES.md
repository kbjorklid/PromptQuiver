# Top 3 Refactoring Opportunities for Prompt Quiver

This document outlines the highest-impact refactoring opportunities identified in the `Prompt Quiver` codebase to improve maintainability, architectural clarity, and visual consistency.

## 1. Centralize and Declarative Input Handling

- [x] **Context:** `src/App.tsx`
- [x] **Problem:** `App.tsx` contains a massive `useInput` hook (lines 160-258) with hardcoded logic for navigation, tab switching, and commands. This makes the main component bloated, shortcuts difficult to maintain/test, and it violates the Single Responsibility Principle.
- [x] **Recommendation:** Extract keyboard handling into a custom hook (e.g., `useAppKeyboard`) or a command-registry pattern. Shortcuts should be defined declaratively (e.g., as a configuration object mapping keys to actions) and kept separate from the UI layout logic.
- [x] **Benefit:** Significantly reduces `App.tsx` complexity, makes adding/modifying shortcuts trivial, and allows for clean isolation of navigation logic.

---

## 2. Reusable Modal/Dialog System

- [x] **Context:** `src/components/EditorView.tsx`
- [x] **Problem:** `EditorView` has its own implementation of a confirmation dialog (lines 40-75, 230-265) for saving and cancelling. This pattern is needed for other parts of the app (e.g., deleting a prompt, clearing archive) but currently requires duplicating both UI and logic.
- [x] **Recommendation:** Create a reusable `Modal` or `ConfirmDialog` component and a `useModal` hook. This should centralize the "popup" logic (positioning, input capture, and rendering) and provide a consistent interface for any confirmation interaction.
- [x] **Benefit:** Promotes code reuse (DRY), ensures UI consistency across all confirmation popups, and simplifies adding new "safety checks" throughout the application.

---

## 3. TUI Design System (Componentize UI Elements)

- [x] **Context:** `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/PromptList.tsx`, `src/components/SettingsView.tsx`
- [x] **Problem:** UI elements like Tabs, Buttons, Cards, and Status Bars are rendered using raw `Box` and `Text` components with repeated styling (colors, borders, padding). This makes it difficult to maintain a consistent visual "look and feel."
- [x] **Recommendation:** Create a library of base TUI components (e.g., `TabItem`, `IconButton`, `StatusBar`, `SelectableRow`) that encapsulate styling and common Ink-specific behaviors.
- [x] **Benefit:** Ensures visual consistency, drastically reduces styling boilerplate, and makes it easier to implement global "themes" or adjust the UI layout in the future.

---

## 4. Minor Cleanup (Dead Code & Efficiency)

- [ ] **Context:** `src/hooks/usePrompts.ts`
- [ ] **Problem:** While already partially refactored, `usePrompts` still acts as a complex orchestrator for toasts, clipboard operations, and state transitions, making it slightly bloated.
- [ ] **Recommendation:** Decouple clipboard operations (`clipboardy.writeSync`) and toast notifications into a unified `useAppFeedback` utility hook. Also, audit `src/utils/` for any legacy functions that could be consolidated into the newer hook-based architecture.
