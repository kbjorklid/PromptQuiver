import { mock } from "bun:test";

export const mockClipboard = {
  writeSync: () => {},
  readSync: () => "",
};

// Mock clipboardy globally for tests to avoid failures in non-TTY environments (Linux CI)
mock.module("clipboardy", () => ({
  ...mockClipboard,
  default: mockClipboard,
}));

// Ensure process.stdout.columns/rows have defaults for tests
if (!process.stdout.columns) {
  Object.defineProperty(process.stdout, 'columns', { value: 100 });
}
if (!process.stdout.rows) {
  Object.defineProperty(process.stdout, 'rows', { value: 20 });
}
