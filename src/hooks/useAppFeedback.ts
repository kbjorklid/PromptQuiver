import { useState, useCallback, useRef } from 'react';
import clipboardy from 'clipboardy';
import type { Toast } from './types';

export function useAppFeedback() {
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, duration = 3000) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToast({ message });
    toastTimer.current = setTimeout(() => {
      setToast(null);
    }, duration);
  }, []);

  const copyToClipboard = useCallback((text: string, successMessage?: string) => {
    try {
      clipboardy.writeSync(text);
      if (successMessage) {
        showToast(successMessage);
      }
      return true;
    } catch (e) {
      showToast('Failed to copy to clipboard');
      return false;
    }
  }, [showToast]);

  const getFromClipboard = useCallback(() => {
    try {
      return clipboardy.readSync();
    } catch (e) {
      showToast('Failed to read from clipboard');
      return null;
    }
  }, [showToast]);

  return {
    toast,
    showToast,
    copyToClipboard,
    getFromClipboard,
  };
}
