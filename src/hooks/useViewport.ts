import { useMemo } from 'react';

interface ViewportResult {
  start: number;
  end: number;
  viewportSize: number;
}

export const calculateViewport = ({
  totalItems,
  selectedIndex,
  terminalRows,
  initialViewportSize,
}: {
  totalItems: number;
  selectedIndex: number;
  terminalRows: number;
  initialViewportSize?: number;
}): ViewportResult => {
  // Overhead: Header (4) + Footer (5) + Search (2) + Padding/Extra (3) = 14 lines
  const reservedLines = 14;
  const availableLines = Math.max(3, terminalRows - reservedLines);
  
  // Each item takes 2 lines for text (name or up to 2 lines of text) + 1 line for separator
  const itemHeight = 3;
  const viewportSize = initialViewportSize || Math.max(1, Math.floor(availableLines / itemHeight));
  
  const half = Math.floor(viewportSize / 2);
  let start = Math.max(0, selectedIndex - half);
  let end = Math.min(totalItems, start + viewportSize);
  
  if (end - start < viewportSize) {
    start = Math.max(0, end - viewportSize);
  }

  return {
    start,
    end,
    viewportSize,
  };
};

interface UseViewportProps {
  totalItems: number;
  selectedIndex: number;
  terminalRows: number;
  initialViewportSize?: number;
}

export const useViewport = ({
  totalItems,
  selectedIndex,
  terminalRows,
  initialViewportSize,
}: UseViewportProps) => {
  return useMemo(() => 
    calculateViewport({ totalItems, selectedIndex, terminalRows, initialViewportSize }),
    [totalItems, selectedIndex, terminalRows, initialViewportSize]
  );
};
