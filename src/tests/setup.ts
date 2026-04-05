import { mock } from "bun:test";
import path from "path";
import os from "os";
import fs from "fs/promises";

export const mockClipboard = {
  writeSync: () => {},
  readSync: () => "",
};

// Mock clipboardy globally for tests to avoid failures in non-TTY environments (Linux CI)
mock.module("clipboardy", () => ({
  ...mockClipboard,
  default: mockClipboard,
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
