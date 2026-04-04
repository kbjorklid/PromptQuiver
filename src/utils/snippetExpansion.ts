import type { Prompt } from '../storage/paths';

/**
 * Expands snippets in the given text.
 * Snippets are identified by the $$ prefix followed by the snippet name.
 * If a snippet name is not found, the variable is left as-is.
 */
export const expandSnippets = (text: string, snippets: Prompt[]): string => {
  return text.replace(/\$\$([a-zA-Z0-9_-]+)/g, (match, name) => {
    const snippet = snippets.find(s => s.name === name);
    return snippet ? snippet.text : match;
  });
};
