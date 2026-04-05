import path from 'path';
import os from 'os';
import crypto from 'crypto';

import type { Settings } from '../hooks/types';

export interface Prompt {
  id: string;
  text: string;
  type: 'prompt' | 'note';
  name?: string;
  branch?: string;
  staged?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromptStorageData {
  main: Prompt[];
  notes: Prompt[];
  archive: Prompt[];
  canned: Prompt[];
  snippets: Prompt[];
  settings: Settings;
}

export const STORAGE_DIR = path.join(os.homedir(), '.promptquiver');

/**
 * Generates the specific filename: prompts-{last-folder-name}-{hash}.yml
 */
export function getStoragePath(cwd: string): string {
  const lastFolder = path.basename(cwd) || 'root';
  const hash = crypto.createHash('sha256').update(cwd).digest('hex').substring(0, 8);
  return path.join(STORAGE_DIR, `prompts-${lastFolder}-${hash}.yml`);
}

/**
 * Path for common prompts (not tied to specific project or branch)
 */
export function getCommonStoragePath(): string {
  return path.join(STORAGE_DIR, 'common.yml');
}
