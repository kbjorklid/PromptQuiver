# Prompt Quiver 🏹

**Prompt Quiver** is a high-performance Terminal User Interface (TUI) application designed for AI power users. It allows you to manage, organize, and queue prompts for AI agents while they are busy processing your current tasks.

Think of it as a "staging area" for your AI interactions, helping you maintain your creative flow without waiting for the model to finish.

## ✨ Core Concepts

- **🚀 Prompts (Main):** Your active queue of tasks for the current project. These are stored per-project and tied to the directory you are working in.
- **📝 Notes:** Project-specific context, long-term instructions, or ideas that aren't necessarily immediate tasks.
- **📦 Canned Prompts:** Global, reusable prompts that are available across all projects. Perfect for standard refactoring instructions or boilerplate requests.
- **🧩 Snippets:** Global reusable text blocks.
  - Type `$` to search and **instantly expand** a snippet into your editor.
  - Type `$$` to insert a **snippet variable** (e.g., `$$boiler`) that is expanded when you save or copy the prompt.
- **📂 Filename Autocomplete:** Type `@` in the editor to fuzzy search and insert project filenames (respects `.gitignore`).
- **🗃️ Archive:** A history of processed or deleted items, allowing for easy recovery or reference.

## ⚡ Rapid Workflow

The core power of Prompt Quiver is the **Stage** (`s`) command. In one keystroke:
1. The highlighted item in your list is marked as **Staged** (indicated by a 🎯 bullseye).
2. It is copied to your clipboard.
3. Any previously staged item is automatically moved to the **Archive**.
4. The staged item is shown dimmed in the list to indicate it's ready.
5. You can un-stage an item by pressing `s` again.

This allows you to prepare exactly which prompt you want to use next, maintain a history of what you've staged, and keep your workspace clean.

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/prompt-quiver.git
cd prompt-quiver

# Install dependencies
bun install
```

### Running the App

```bash
bun start
```

For convenience, you can alias the command in your shell:
`alias quiver='bun --cwd /path/to/prompt-quiver index.tsx'`

## ⌨️ Keyboard Shortcuts

### Navigation
- `Up`/`Down` or `j`/`k`: Move selection.
- `1`-`9`: Jump to the corresponding visible tab.
- `Tab` or `h`/`l`: Switch between **Prompts / Notes / Canned / Snippets / Archive / Settings** tabs.
- `b`: Toggle branch filter (show only items for the current git branch).
- `Esc`: Clear search or exit current view.

### Editor Features
- `@`: Trigger filename autocomplete.
- `$`: Trigger immediate snippet expansion.
- `$$`: Trigger snippet variable insertion.
- `Ctrl + s`: Save and exit.

### Management
- `Enter` or `e`: Open Editor for the selected item.
- `c` (or `y`): Copy text to clipboard.
- `a` / `A`: Add new item after current / at end of list.
- `i` / `I`: Add new item before current / at beginning of list.
- `d`: Move to Archive (from Prompts/Notes) or Delete permanently (from Archive).
- `r`: Restore item (from Archive back to original list).
- `s`: **Stage** (Mark with 🎯, copy to clipboard, and archive previous).

### History & Meta
- `u`: Undo last list operation.
- `Ctrl + y`: Redo last operation.
- `S`: Open Settings.
- `q`: Quit application.

## 💾 Storage

- **Project Data:** Stored in `~/.promptquiver/prompts-{folder}-{hash}.yml`.
- **Global Data:** Canned prompts and Snippets are stored in `~/.promptquiver/common.yml`.

## 🛠️ Development

### Project Structure
- `src/App.tsx`: Root component and main state management.
- `src/hooks/usePrompts.ts`: Core logic for managing prompt lists.
- `src/utils/fileSearch.ts`: Logic for `@` filename autocomplete.
- `src/utils/snippetExpansion.ts`: Logic for `$$` snippet expansion.
- `src/tests/`: Comprehensive test suite.

### Commands
- `bun start`: Run development mode.
- `bun test`: Run all tests.
- `tsc --noEmit`: Run type checking.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
