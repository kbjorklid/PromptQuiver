import { useEffect, useRef, useCallback } from 'react';
import type { PromptStorageData } from '../storage';
import { savePrompts as defaultSavePrompts } from '../storage';

interface UseAutoSaveProps {
  cwd: string;
  data: PromptStorageData;
  isLoading: boolean;
  savePromptsFn?: typeof defaultSavePrompts;
  onSaveError?: (error: any) => void;
  debounceMs?: number;
}

export function useAutoSave({
  cwd,
  data,
  isLoading,
  savePromptsFn = defaultSavePrompts,
  onSaveError,
  debounceMs = 1000,
}: UseAutoSaveProps) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestData = useRef(data);
  const isSaving = useRef(false);
  const hasPendingSave = useRef(false);

  // Update latest data ref
  useEffect(() => {
    latestData.current = data;
  }, [data]);

  const performSave = useCallback(async (dataToSave: PromptStorageData) => {
    if (isSaving.current) {
      hasPendingSave.current = true;
      return;
    }

    isSaving.current = true;
    hasPendingSave.current = false;
    
    try {
      await savePromptsFn(cwd, dataToSave);
    } catch (err) {
      if (onSaveError) {
        onSaveError(err);
      }
    } finally {
      isSaving.current = false;
      // If data changed while we were saving, trigger another save
      if (hasPendingSave.current) {
        performSave(latestData.current);
      }
    }
  }, [cwd, savePromptsFn, onSaveError]);

  const triggerSave = useCallback((immediate = false, dataToSave?: PromptStorageData) => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    const finalData = dataToSave || latestData.current;

    if (immediate) {
      performSave(finalData);
    } else {
      saveTimer.current = setTimeout(() => {
        performSave(finalData);
      }, debounceMs);
    }
  }, [debounceMs, performSave]);

  useEffect(() => {
    if (isLoading) return;
    triggerSave(false);

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [data, isLoading, triggerSave]);

  // Ensure save on unmount if pending
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        savePromptsFn(cwd, latestData.current).catch(err => {
            console.error('Failed to save on unmount:', err);
        });
      }
    };
  }, [cwd, savePromptsFn]);

  return { triggerSave };
}
