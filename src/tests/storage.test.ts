import { expect, test, describe, afterEach } from "bun:test";
import fs from "fs/promises";
import path from "path";
import { getStoragePath, STORAGE_DIR } from "../storage/paths";
import { loadPrompts, savePrompts, ensureStorageDir } from "../storage/index";

describe("Storage", () => {
  const mockCwd = path.join(process.cwd(), "test-project");
  const expectedPath = getStoragePath(mockCwd);

  afterEach(async () => {
    try {
      await fs.unlink(expectedPath);
    } catch {}
  });

  test("getStoragePath generates correct filename", () => {
    const filePath = getStoragePath(mockCwd);
    expect(path.basename(filePath)).toMatch(/^prompts-test-project-[a-f0-9]{8}\.yml$/);
  });

  test("savePrompts creates a YAML file", async () => {
    const data = {
      main: [
        {
          id: "1",
          text: "First prompt\nwith multiple lines",
          type: "prompt" as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ],
      notes: [],
      archive: []
    };

    await savePrompts(mockCwd, data);
    const exists = await fs.stat(expectedPath);
    expect(exists.isFile()).toBe(true);

    const content = await fs.readFile(expectedPath, "utf-8");
    expect(content).toContain("First prompt");
    expect(content).toContain("with multiple lines");
  });

  test("loadPrompts loads saved data", async () => {
    const data = {
      main: [{ id: "2", text: "Hello", type: "prompt" as const, created_at: "now", updated_at: "now" }],
      notes: [{ id: "3", text: "Note", type: "note" as const, created_at: "now", updated_at: "now" }],
      archive: []
    };

    await savePrompts(mockCwd, data);
    const loaded = await loadPrompts(mockCwd);
    expect(loaded!.main[0]!.text).toBe("Hello");
    expect(loaded!.main[0]!.id).toBe("2");
    expect(loaded!.notes[0]!.text).toBe("Note");
  });

  test("loadPrompts returns default data if file missing", async () => {
    const loaded = await loadPrompts("non-existent-path");
    expect(loaded.main).toBeArray();
    expect(loaded.notes).toBeArray();
    expect(loaded.archive).toBeArray();
    expect(loaded.main.length).toBe(0);
  });
});
