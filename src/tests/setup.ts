import { mock, afterEach } from "bun:test";
import path from "path";
import os from "os";
import fs from "fs/promises";
import { useCallback, useState, useEffect } from 'react';

export const mockClipboard = {
  writeSync: (text: string) => {},
  readSync: () => "",
};

// Global branch mock state
export const mockBranchState = {
  currentBranch: "main" as string | undefined,
  branchFilterEnabled: false,
};

afterEach(() => {
  mockBranchState.currentBranch = "main";
  mockBranchState.branchFilterEnabled = false;
  mockClipboard.writeSync = (text: string) => {};
  mockClipboard.readSync = () => "";
});

// Mock the hook globally
mock.module("../hooks/useBranchFilter", () => ({
  useBranchFilter: (cwd: string, pollInterval: number = 10000) => {
    const [enabled, setEnabled] = useState(mockBranchState.branchFilterEnabled);
    const [branch, setBranch] = useState(mockBranchState.currentBranch);
    
    const refresh = useCallback(() => {
      setBranch(mockBranchState.currentBranch);
      return mockBranchState.currentBranch;
    }, [cwd]); // Match [cwd]
    
    const toggle = useCallback(() => {
      setEnabled(prev => !prev);
    }, [refresh]); // Match [refreshCurrentBranch]

    useEffect(() => {
      // initial refresh
    }, [refresh]);

    useEffect(() => {
      // polling
    }, [refresh, pollInterval]);

    return {
      branchFilterEnabled: enabled,
      currentBranch: branch,
      toggleBranchFilter: toggle,
      refreshCurrentBranch: refresh,
    };
  },
}));

// Mock clipboardy globally for tests to avoid failures in non-TTY environments (Linux CI)
mock.module("clipboardy", () => ({
  writeSync: (text: string) => {
    mockClipboard.writeSync(text);
  },
  readSync: () => {
    return mockClipboard.readSync();
  },
  default: {
    writeSync: (text: string) => {
      mockClipboard.writeSync(text);
    },
    readSync: () => {
      return mockClipboard.readSync();
    },
  },
}));

// Create a unique temp directory for this test process (test file)
const TEST_STORAGE_DIR = path.join(os.tmpdir(), `promptquiver-test-${Math.random().toString(36).substring(7)}`);

// Ensure it exists (synchronously if possible, or just let first call to ensureStorageDir handle it)
// But since we are mocking STORAGE_DIR in paths.ts, we should use mock.module.
import * as originalPaths from '../storage/paths';

mock.module("../storage/paths", () => ({
  ...originalPaths,
  STORAGE_DIR: TEST_STORAGE_DIR,
  getStoragePath: (cwd: string) => {
    const lastFolder = path.basename(cwd) || 'root';
    const hash = require('crypto').createHash('sha256').update(cwd).digest('hex').substring(0, 8);
    return path.join(TEST_STORAGE_DIR, `prompts-${lastFolder}-${hash}.yml`);
  },
  getCommonStoragePath: () => path.join(TEST_STORAGE_DIR, 'common.yml'),
}));

// Ensure process.stdout.columns/rows have defaults for tests
if (!process.stdout.columns) {
  Object.defineProperty(process.stdout, 'columns', { value: 100 });
}
if (!process.stdout.rows) {
  Object.defineProperty(process.stdout, 'rows', { value: 30 });
}

// Increase max listeners for stdout to avoid warnings during parallel tests
process.stdout.setMaxListeners(100);
