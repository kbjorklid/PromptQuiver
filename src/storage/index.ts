import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
export * from './paths';
import { STORAGE_DIR, getStoragePath } from './paths';
import type { Prompt, PromptStorageData } from './paths';

const DEFAULT_DATA: PromptStorageData = {
  main: [],
  notes: [],
  archive: [],
};

export async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (err) {
    // Already exists or permission error
  }
}

export async function loadPrompts(cwd: string): Promise<PromptStorageData> {
  const filePath = getStoragePath(cwd);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = yaml.load(content) as any;
    
    // Helper to ensure type field
    const ensureType = (list: any[], defaultType: 'prompt' | 'note'): Prompt[] => {
      if (!Array.isArray(list)) return [];
      return list.map(item => ({
        ...item,
        type: item.type || defaultType
      }));
    };

    // Validate schema
    return {
      main: ensureType(data?.main, 'prompt'),
      notes: ensureType(data?.notes, 'note'),
      archive: ensureType(data?.archive, 'prompt'), // Default to prompt for older archives
    };
  } catch (err) {
    // If file doesn't exist, return default
    return DEFAULT_DATA;
  }
}

export async function savePrompts(cwd: string, data: PromptStorageData): Promise<void> {
  const filePath = getStoragePath(cwd);
  await ensureStorageDir();
  
  // Use YAML literal blocks for multi-line strings
  const yamlContent = yaml.dump(data, {
    lineWidth: -1,
    noRefs: true,
  });
  
  await fs.writeFile(filePath, yamlContent, 'utf-8');
}
