export type Tab = 'main' | 'notes' | 'archive' | 'canned' | 'snippets' | 'settings';
export type View = 'list' | 'editor';

export interface Settings {
  tabVisibility: Record<Tab, boolean>;
  slashCommands?: string[];
}

export interface Toast {
  message: string;
}
