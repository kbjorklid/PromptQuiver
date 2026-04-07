/**
 * Strips comments from prompt text.
 * Comments are any lines that start with '--'.
 * If the prompt starts with a comment title (comment followed by empty line),
 * both the comment line and the empty line are removed.
 */
export const stripComments = (text: string): string => {
  const lines = text.split('\n');
  if (lines.length >= 2 && lines[0].startsWith('--') && lines[1].trim() === '') {
    // Start with the third line
    return lines.slice(2)
      .filter(line => !line.startsWith('--'))
      .join('\n');
  }

  return lines
    .filter(line => !line.startsWith('--'))
    .join('\n');
};

/**
 * Extracts a title from the first line if it's a comment followed by an empty line.
 * Returns null if the criteria are not met.
 */
export const getCommentTitle = (text: string): string | null => {
  const lines = text.split('\n');
  if (lines.length >= 2 && lines[0].startsWith('--') && lines[1].trim() === '') {
    return lines[0].substring(2).trim();
  }
  return null;
};
