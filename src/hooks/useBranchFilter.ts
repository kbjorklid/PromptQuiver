import { useState, useCallback, useEffect } from 'react';
import { getCurrentGitBranch } from '../utils/git';

export function useBranchFilter(cwd: string, pollInterval: number = 10000) {
  const [branchFilterEnabled, setBranchFilterEnabled] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<string | undefined>(undefined);

  const refreshCurrentBranch = useCallback(() => {
    const branch = getCurrentGitBranch(cwd);
    setCurrentBranch(branch);
    return branch;
  }, [cwd]);

  const toggleBranchFilter = useCallback(() => {
    setBranchFilterEnabled(prev => {
      const next = !prev;
      if (next) {
        refreshCurrentBranch();
      }
      return next;
    });
  }, [refreshCurrentBranch]);

  useEffect(() => {
    refreshCurrentBranch();
  }, [refreshCurrentBranch]);

  useEffect(() => {
    const interval = setInterval(refreshCurrentBranch, pollInterval);
    return () => clearInterval(interval);
  }, [refreshCurrentBranch, pollInterval]);

  return {
    branchFilterEnabled,
    currentBranch,
    toggleBranchFilter,
    refreshCurrentBranch,
  };
}
