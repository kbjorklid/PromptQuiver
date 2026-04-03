import path from 'path';
import os from 'os';
import crypto from 'crypto';

export interface Prompt {
  id: string;
  text: string;
  type: 'prompt' | 'note';
  created_at: string;
  updated_at: string;
}

export interface PromptStorageData {
  main: Prompt[];
  notes: Prompt[];
  archive: Prompt[];
}

export const STORAGE_DIR = path.join(os.homedir(), '.promptcue');

/**
 * Generates the specific filename: prompts-{last-folder-name}-{hash}.yml
 */
export function getStoragePath(cwd: string): string {
  const lastFolder = path.basename(cwd) || 'root';
  const hash = crypto.createHash('sha256').update(cwd).digest('hex').substring(0, 8);
  return path.join(STORAGE_DIR, `prompts-${lastFolder}-${hash}.yml`);
}
