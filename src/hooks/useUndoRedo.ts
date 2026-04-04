import { useState, useCallback } from 'react';

export function useUndoRedo<T>(initialState: T) {
  const [state, setState] = useState<{
    present: T;
    past: T[];
    future: T[];
  }>({
    present: initialState,
    past: [],
    future: [],
  });

  const setPresent = useCallback((nextPresent: T) => {
    setState(current => ({
      past: [...current.past, current.present],
      future: [],
      present: nextPresent,
    }));
  }, []);

  const undo = useCallback(() => {
    setState(current => {
      if (current.past.length === 0) return current;
      const previous = current.past[current.past.length - 1];
      const newPast = current.past.slice(0, current.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [current.present, ...current.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(current => {
      if (current.future.length === 0) return current;
      const next = current.future[0];
      const newFuture = current.future.slice(1);
      return {
        past: [...current.past, current.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((newInitialState: T) => {
    setState({
      present: newInitialState,
      past: [],
      future: [],
    });
  }, []);

  return {
    state: state.present,
    setState: setPresent,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
