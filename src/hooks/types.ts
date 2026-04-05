export type Tab = 'main' | 'notes' | 'archive' | 'canned' | 'snippets' | 'settings';
export type View = 'list' | 'editor' | 'globalSearch';

export interface Settings {
  tabVisibility: Record<Tab, boolean>;
  slashCommands?: string[];
  enableClaudeCommands?: boolean;
}

export interface Toast {
  message: string;
}
