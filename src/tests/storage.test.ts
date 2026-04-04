import { expect, test, describe, afterEach } from "bun:test";
import fs from "fs/promises";
import path from "path";
import yaml from 'js-yaml';
import { getStoragePath, getCommonStoragePath, STORAGE_DIR } from "../storage/paths";
import { loadPrompts, savePrompts, ensureStorageDir } from "../storage/index";

describe("Storage", () => {
  const mockCwd = path.join(process.cwd(), "test-project");
  const expectedPath = getStoragePath(mockCwd);
  const commonPath = getCommonStoragePath();

  afterEach(async () => {
    try {
      await fs.unlink(expectedPath);
    } catch {}
    try {
      await fs.unlink(commonPath);
    } catch {}
  });

  test("getStoragePath generates correct filename", () => {
    const filePath = getStoragePath(mockCwd);
    expect(path.basename(filePath)).toMatch(/^prompts-test-project-[a-f0-9]{8}\.yml$/);
  });

  test("savePrompts creates a YAML file for project and common", async () => {
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
      archive: [],
      canned: [
        {
          id: "4",
          text: "Canned prompt",
          type: "prompt" as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]
    };

    await savePrompts(mockCwd, data);
    
    // Check project file
    const projectExists = await fs.stat(expectedPath);
    expect(projectExists.isFile()).toBe(true);
    const projectContent = await fs.readFile(expectedPath, "utf-8");
    expect(projectContent).toContain("First prompt");

    // Check common file
    const commonExists = await fs.stat(commonPath);
    expect(commonExists.isFile()).toBe(true);
    const commonContent = await fs.readFile(commonPath, "utf-8");
    expect(commonContent).toContain("Canned prompt");
    expect(commonContent).toContain("canned-prompts:");
  });

  test("savePrompts preserves other categories in common.yml", async () => {
    await ensureStorageDir();
    const otherData = { 'other-category': [{ name: 'test' }] };
    await fs.writeFile(commonPath, yaml.dump(otherData), 'utf-8');

    const data = {
      main: [],
      notes: [],
      archive: [],
      canned: [{ id: "5", text: "Canned 2", type: "prompt" as const, created_at: "now", updated_at: "now" }]
    };

    await savePrompts(mockCwd, data);
    
    const commonContent = await fs.readFile(commonPath, "utf-8");
    const commonLoaded = yaml.load(commonContent) as any;
    expect(commonLoaded['canned-prompts']).toBeArray();
    expect(commonLoaded['canned-prompts'][0].text).toBe("Canned 2");
    expect(commonLoaded['other-category']).toBeArray();
    expect(commonLoaded['other-category'][0].name).toBe("test");
  });

  test("loadPrompts loads saved data from both files", async () => {
    const data = {
      main: [{ id: "2", text: "Hello", type: "prompt" as const, created_at: "now", updated_at: "now" }],
      notes: [{ id: "3", text: "Note", type: "note" as const, created_at: "now", updated_at: "now" }],
      archive: [],
      canned: [{ id: "6", text: "Canned 3", type: "prompt" as const, created_at: "now", updated_at: "now" }]
    };

    await savePrompts(mockCwd, data);
    const loaded = await loadPrompts(mockCwd);
    expect(loaded!.main[0]!.text).toBe("Hello");
    expect(loaded!.notes[0]!.text).toBe("Note");
    expect(loaded!.canned[0]!.text).toBe("Canned 3");
  });

  test("loadPrompts returns default data if files missing", async () => {
    const loaded = await loadPrompts("non-existent-path");
    expect(loaded.main).toBeArray();
    expect(loaded.notes).toBeArray();
    expect(loaded.archive).toBeArray();
    expect(loaded.canned).toBeArray();
    expect(loaded.main.length).toBe(0);
  });
});
