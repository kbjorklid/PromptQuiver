import { useState, useCallback, useEffect } from 'react';
import { getCurrentGitBranch } from '../utils/git';

export function useBranchFilter(cwd: string) {
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
    if (!branchFilterEnabled) return;
    refreshCurrentBranch();
    const interval = setInterval(refreshCurrentBranch, 10000);
    return () => clearInterval(interval);
  }, [branchFilterEnabled, refreshCurrentBranch]);

  return {
    branchFilterEnabled,
    currentBranch,
    toggleBranchFilter,
    refreshCurrentBranch,
  };
}
