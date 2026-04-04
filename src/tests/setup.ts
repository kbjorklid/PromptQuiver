import { mock } from "bun:test";

// Mock clipboardy globally for tests to avoid failures in non-TTY environments (Linux CI)
mock.module("clipboardy", () => ({
  default: {
    writeSync: () => {},
    readSync: () => "",
  },
}));

// Ensure process.stdout.columns/rows have defaults for tests
if (!process.stdout.columns) {
  Object.defineProperty(process.stdout, 'columns', { value: 100 });
}
if (!process.stdout.rows) {
  Object.defineProperty(process.stdout, 'rows', { value: 20 });
}
