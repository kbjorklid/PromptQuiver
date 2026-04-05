import { useMemo } from 'react';

interface ViewportResult {
  start: number;
  end: number;
  viewportSize: number;
}

export const getItemHeight = (prompt: { name?: string; text: string }): number => {
  if (prompt.name) return 2; // 1 line for name + 1 line for separator
  const lines = prompt.text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 2);
  const textHeight = Math.max(1, lines.length);
  return textHeight + 1; // text height + 1 line for separator
};

export const getItemTextHeight = (prompt: { name?: string; text: string }): number => {
  if (prompt.name) return 1; // name line
  const lines = prompt.text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 2);
  return Math.max(1, lines.length);
};

export const calculateViewport = ({
  list,
  selectedIndex,
  terminalRows,
  initialViewportSize,
  isSearching = false,
}: {
  list: { name?: string; text: string }[];
  selectedIndex: number;
  terminalRows: number;
  initialViewportSize?: number;
  isSearching?: boolean;
}): ViewportResult => {
  const totalItems = list.length;
  if (totalItems === 0) {
    return { start: 0, end: 0, viewportSize: 0 };
  }

  if (initialViewportSize) {
    const viewportSize = initialViewportSize;
    const half = Math.floor(viewportSize / 2);
    let start = Math.max(0, selectedIndex - half);
    let end = Math.min(totalItems, start + viewportSize);
    if (end - start < viewportSize) {
      start = Math.max(0, end - viewportSize);
    }
    return { start, end, viewportSize };
  }

  // Overhead: Header (5) + Footer (6) = 11 lines. Search is 2 lines if active.
  const reservedLines = isSearching ? 13 : 11;
  const availableLines = Math.max(3, terminalRows - reservedLines);

  // Dynamic calculation based on actual item heights
  const safeSelectedIndex = Math.min(totalItems - 1, Math.max(0, selectedIndex));
  
  // Note: We use getItemTextHeight for the first item, and add 1 for each additional item (separator + text)
  let currentHeight = getItemTextHeight(list[safeSelectedIndex]!);
  let start = safeSelectedIndex;
  let end = safeSelectedIndex + 1;

  let canExpandUp = true;
  let canExpandDown = true;
  let expandDownNext = true;

  while (currentHeight < availableLines && (canExpandUp || canExpandDown)) {
    if (expandDownNext && canExpandDown) {
      if (end < totalItems) {
        // Adding an item adds its text height + 1 line for the separator that now goes between them
        const nextHeight = getItemTextHeight(list[end]!) + 1;
        if (currentHeight + nextHeight <= availableLines) {
          currentHeight += nextHeight;
          end++;
        } else {
          canExpandDown = false;
        }
      } else {
        canExpandDown = false;
      }
      if (canExpandUp) expandDownNext = false;
    } else if (canExpandUp) {
      if (start > 0) {
        // Adding an item adds its text height + 1 line for the separator that now goes between them
        const prevHeight = getItemTextHeight(list[start - 1]!) + 1;
        if (currentHeight + prevHeight <= availableLines) {
          currentHeight += prevHeight;
          start--;
        } else {
          canExpandUp = false;
        }
      } else {
        canExpandUp = false;
      }
      if (canExpandDown) expandDownNext = true;
    } else {
      break; // Should not be reached, but just in case
    }
  }

  return {
    start,
    end,
    viewportSize: end - start,
  };
};

interface UseViewportProps {
  list: { name?: string; text: string }[];
  selectedIndex: number;
  terminalRows: number;
  initialViewportSize?: number;
  isSearching?: boolean;
}

export const useViewport = ({
  list,
  selectedIndex,
  terminalRows,
  initialViewportSize,
  isSearching = false,
}: UseViewportProps) => {
  return useMemo(() => 
    calculateViewport({ list, selectedIndex, terminalRows, initialViewportSize, isSearching }),
    [list, selectedIndex, terminalRows, initialViewportSize, isSearching]
  );
};
