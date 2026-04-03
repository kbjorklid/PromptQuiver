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
  // Estimate: Header (4) + Footer (4) + Search (1) + Padding/Extra (2) = 11 lines overhead.
  // Each item takes 2 or 3 lines (average 3.0 including separators).
  const defaultViewportSize = Math.max(3, Math.floor((terminalRows - 11) / 3));
  const viewportSize = initialViewportSize || defaultViewportSize;
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
