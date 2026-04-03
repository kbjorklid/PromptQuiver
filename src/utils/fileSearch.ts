import fs from 'fs/promises';
import path from 'path';
import ignore from 'ignore';

export async function fuzzySearchFiles(query: string, cwd: string, maxResults: number = 20): Promise<string[]> {
  let currentDir = cwd;
  let ig = ignore();
  let ignoreDir: string | null = null;

  // Find the first .gitignore going upwards
  while (true) {
    try {
      const p = path.join(currentDir, '.gitignore');
      const content = await fs.readFile(p, 'utf8');
      ig.add(content);
      ignoreDir = currentDir;
      break;
    } catch (e) {
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) break; // Root reached
      currentDir = parentDir;
    }
  }

  // Always ignore .git and node_modules
  ig.add(['.git', 'node_modules']);

  const results: string[] = [];
  const lowerQuery = query.toLowerCase();

  async function walk(dir: string, relPath: string) {
    if (results.length >= maxResults * 5) return; // Cap search space
    
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (e) {
      return;
    }

    for (const entry of entries) {
      const entryRelPath = relPath ? path.join(relPath, entry.name).replace(/\\/g, '/') : entry.name;
      
      // Calculate path relative to ignoreDir for proper pattern matching
      let pathForIgnore = entryRelPath;
      if (ignoreDir) {
        const fullPath = path.join(cwd, entryRelPath);
        pathForIgnore = path.relative(ignoreDir, fullPath).replace(/\\/g, '/');
      }
      
      if (ig.ignores(pathForIgnore)) continue;

      if (entry.isDirectory()) {
        const displayPath = entryRelPath + '/';
        if (displayPath.toLowerCase().includes(lowerQuery)) {
          results.push(displayPath);
        }
        await walk(path.join(dir, entry.name), entryRelPath);
      } else {
        if (entryRelPath.toLowerCase().includes(lowerQuery)) {
          results.push(entryRelPath);
        }
      }
    }
  }

  await walk(cwd, '');

  // Prioritize exact substring match at the beginning, then others
  results.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    const aStarts = aLower.startsWith(lowerQuery);
    const bStarts = bLower.startsWith(lowerQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return aLower.localeCompare(bLower);
  });

  return results.slice(0, maxResults);
}
