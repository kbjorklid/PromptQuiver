import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
export * from './paths';
import { STORAGE_DIR, getStoragePath, getCommonStoragePath } from './paths';
import type { Prompt, PromptStorageData } from './paths';
import type { Tab, Settings } from '../hooks/types';


const DEFAULT_SETTINGS: Settings = {
  tabVisibility: {
    main: true,
    notes: true,
    canned: true,
    snippets: true,
    archive: true,
    settings: true,
  },
  slashCommands: [],
  enableClaudeCommands: false,
};

const DEFAULT_DATA: PromptStorageData = {
  main: [],
  notes: [],
  archive: [],
  canned: [],
  snippets: [],
  settings: DEFAULT_SETTINGS,
};

export async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (err) {
    // Already exists or permission error
  }
}

// Helper to ensure type field
const ensureType = (list: any[], defaultType: 'prompt' | 'note'): Prompt[] => {
  if (!Array.isArray(list)) return [];
  return list.map(item => ({
    ...item,
    type: item.type || defaultType
  }));
};

const ensureSettings = (settings: any): Settings => {
  if (!settings || typeof settings !== 'object') return DEFAULT_SETTINGS;
  const tabVisibility = { ...DEFAULT_SETTINGS.tabVisibility, ...(settings.tabVisibility || {}) };
  const slashCommands = Array.isArray(settings.slashCommands) ? settings.slashCommands : [];
  const enableClaudeCommands = typeof settings.enableClaudeCommands === 'boolean' ? settings.enableClaudeCommands : false;
  return { tabVisibility, slashCommands, enableClaudeCommands };
};

export async function loadPrompts(cwd: string): Promise<PromptStorageData> {
  const filePath = getStoragePath(cwd);
  const commonPath = getCommonStoragePath();
  
  let projectData: any = {};
  let commonData: any = {};

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    projectData = yaml.load(content) || {};
  } catch (err) {
    // Project file missing, handled by default empty object
  }

  try {
    const commonContent = await fs.readFile(commonPath, 'utf-8');
    commonData = yaml.load(commonContent) || {};
  } catch (err) {
    // Common file missing
  }

  return {
    main: ensureType(projectData?.main, 'prompt'),
    notes: ensureType(projectData?.notes, 'note'),
    archive: ensureType(projectData?.archive, 'prompt'),
    canned: ensureType(commonData?.['canned-prompts'], 'prompt'),
    snippets: ensureType(commonData?.snippets, 'prompt'),
    settings: ensureSettings(commonData?.settings),
  };
}

export interface GlobalSearchResult extends Prompt {
  projectName: string;
}

export async function searchGlobalPrompts(query: string, type: 'prompt' | 'note'): Promise<GlobalSearchResult[]> {
  try {
    const files = await fs.readdir(STORAGE_DIR);
    const yamlFiles = files.filter(f => f.endsWith('.yml'));
    
    const results: GlobalSearchResult[] = [];
    
    for (const file of yamlFiles) {
      const filePath = path.join(STORAGE_DIR, file);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const data = yaml.load(content) as any;
        if (!data) continue;
        
        const projectName = file.startsWith('prompts-') 
          ? file.replace(/^prompts-/, '').replace(/-[a-f0-9]{8}\.yml$/, '')
          : file.replace(/\.yml$/, '');
        
        const categories = type === 'prompt' ? ['main', 'archive'] : ['notes', 'archive'];
        
        for (const cat of categories) {
          const list = data[cat];
          if (Array.isArray(list)) {
            for (const item of list) {
              if (item && typeof item.text === 'string' && (item.type || (cat === 'notes' ? 'note' : 'prompt')) === type) {
                if (item.text.toLowerCase().includes(query.toLowerCase())) {
                  results.push({ ...item, type: item.type || type, projectName });
                }
              }
            }
          }
        }
      } catch (err) {
        // Ignore files that can't be read or parsed
      }
    }
    
    return results;
  } catch (err) {
    return [];
  }
}

export async function savePrompts(cwd: string, data: PromptStorageData): Promise<void> {
  const filePath = getStoragePath(cwd);
  const commonPath = getCommonStoragePath();
  await ensureStorageDir();

  // 1. Save project-specific prompts
  const projectToSave = {
    main: data.main,
    notes: data.notes,
    archive: data.archive,
  };
  const projectYaml = yaml.dump(projectToSave, { lineWidth: -1, noRefs: true });
  const projectTempPath = `${filePath}.${Math.random().toString(36).substring(7)}.tmp`;
  await fs.writeFile(projectTempPath, projectYaml, 'utf-8');
  await fs.rename(projectTempPath, filePath);

  // 2. Save common prompts (preserving other categories)
  let existingCommon: any = {};
  try {
    const commonContent = await fs.readFile(commonPath, 'utf-8');
    existingCommon = yaml.load(commonContent) || {};
  } catch (err) {
    // common.yml might not exist yet
  }

  const newCommon = {
    ...existingCommon,
    'canned-prompts': data.canned,
    'snippets': data.snippets,
    'settings': data.settings,
  };
  const commonYaml = yaml.dump(newCommon, { lineWidth: -1, noRefs: true });
  const commonTempPath = `${commonPath}.${Math.random().toString(36).substring(7)}.tmp`;
  await fs.writeFile(commonTempPath, commonYaml, 'utf-8');
  await fs.rename(commonTempPath, commonPath);
}
