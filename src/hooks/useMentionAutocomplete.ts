import { useState, useEffect, useRef } from 'react';
import { fuzzySearchFiles } from '../utils/fileSearch';
import type { Prompt } from '../storage/paths';

export type MentionType = 'file' | 'snippet-expand' | 'snippet-var';

export interface UseMentionAutocompleteProps {
  snippets: Prompt[];
  onApply: (text: string, start: number, end: number) => void;
  allowSnippets?: boolean;
}

export function useMentionAutocomplete({ snippets, onApply, allowSnippets = true }: UseMentionAutocompleteProps) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionType, setMentionType] = useState<MentionType | null>(null);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionEnd, setMentionEnd] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const prevMentionQuery = useRef<string | null>(null);
  const prevMentionType = useRef<MentionType | null>(null);

  useEffect(() => {
    if (mentionQuery === null) {
      setSearchResults(prev => prev.length === 0 ? prev : []);
      setSelectedIndex(prev => prev === 0 ? prev : 0);
      prevMentionQuery.current = null;
      prevMentionType.current = null;
      return;
    }

    const fetchResults = async () => {
      let results: string[] = [];
      if (mentionType === 'file') {
        results = await fuzzySearchFiles(mentionQuery, process.cwd());
      } else if (mentionType === 'snippet-expand' || mentionType === 'snippet-var') {
        results = snippets
          .filter(s => s.name?.toLowerCase().includes(mentionQuery.toLowerCase()))
          .map(s => s.name!)
          .sort();
      }
      
      setSearchResults(results);
      
      if (mentionQuery !== prevMentionQuery.current || mentionType !== prevMentionType.current) {
        setSelectedIndex(0);
        prevMentionQuery.current = mentionQuery;
        prevMentionType.current = mentionType;
      }
    };
    fetchResults();
  }, [mentionQuery, mentionType, snippets]);

  const checkMention = (val: string, cursor: number) => {
    const beforeCursor = val.slice(0, cursor);
    const fileMatch = beforeCursor.match(/(?:^|\s)@([^\s]*)$/);
    const snippetVarMatch = allowSnippets ? beforeCursor.match(/(?:^|\s)\$\$([^\s]*)$/) : null;
    const snippetExpandMatch = allowSnippets ? beforeCursor.match(/(?:^|\s)\$([^\s]*)$/) : null;

    if (fileMatch && fileMatch[1] !== undefined) {
      setMentionType('file');
      setMentionQuery(fileMatch[1]);
      setMentionStart(cursor - fileMatch[1].length - 1);
      setMentionEnd(cursor);
    } else if (snippetVarMatch && snippetVarMatch[1] !== undefined) {
      setMentionType('snippet-var');
      setMentionQuery(snippetVarMatch[1]);
      setMentionStart(cursor - snippetVarMatch[1].length - 2);
      setMentionEnd(cursor);
    } else if (snippetExpandMatch && snippetExpandMatch[1] !== undefined) {
      setMentionType('snippet-expand');
      setMentionQuery(snippetExpandMatch[1]);
      setMentionStart(cursor - snippetExpandMatch[1].length - 1);
      setMentionEnd(cursor);
    } else {
      setMentionType(null);
      setMentionQuery(null);
      setMentionStart(null);
      setMentionEnd(null);
    }
  };

  const handleInterceptKey = (input: string | undefined, key: any) => {
    if (mentionQuery !== null) {
      if (key.upArrow) {
        setSelectedIndex(i => Math.max(0, i - 1));
        return true; // Intercept
      }
      if (key.downArrow) {
        setSelectedIndex(i => Math.min(searchResults.length - 1, i + 1));
        return true; // Intercept
      }
      if (key.return || key.tab) {
        if (searchResults[selectedIndex] && mentionStart !== null && mentionEnd !== null) {
          const result = searchResults[selectedIndex];
          if (mentionType === 'file') {
            onApply("@" + result + " ", mentionStart, mentionEnd);
          } else if (mentionType === 'snippet-var') {
            onApply("$$" + result + " ", mentionStart, mentionEnd);
          } else if (mentionType === 'snippet-expand') {
            const snippet = snippets.find(s => s.name === result);
            if (snippet) {
              onApply(snippet.text + " ", mentionStart, mentionEnd);
            }
          }
        }
        closeAutocomplete();
        return true; // Intercept
      }
      if (key.escape) {
        closeAutocomplete();
        return true; // Intercept
      }
    }
    return false;
  };

  const closeAutocomplete = () => {
    setMentionQuery(null);
    setMentionType(null);
    setMentionStart(null);
    setMentionEnd(null);
  };

  return {
    mentionQuery,
    mentionType,
    searchResults,
    selectedIndex,
    setSelectedIndex,
    checkMention,
    handleInterceptKey,
    closeAutocomplete
  };
}
