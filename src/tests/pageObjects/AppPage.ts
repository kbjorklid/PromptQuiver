import { expect } from "bun:test";
import { render } from 'ink-testing-library';
import type { Tab } from '../../hooks/types';

export class AppPage {
  private renderResult: ReturnType<typeof render>;

  constructor(renderResult: ReturnType<typeof render>) {
    this.renderResult = renderResult;
  }

  async wait(ms = 50) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async write(text: string, waitMs = 100) {
    this.renderResult.stdin.write(text);
    await this.wait(waitMs);
  }

  get frame() {
    return this.renderResult.lastFrame();
  }

  async switchTab(tab: Tab) {
    const tabMap: Record<Tab, string> = {
      'main': '1',
      'canned': '2',
      'notes': '3',
      'snippets': '4',
      'archive': '5',
      'settings': '6'
    };
    await this.write(tabMap[tab]);
  }

  async switchTabByNumber(num: number | string) {
    await this.write(num.toString());
  }

  async nextTab() {
    await this.write('\t');
  }

  async navigateDown() {
    await this.write('j');
  }

  async navigateUp() {
    await this.write('k');
  }

  async addPrompt() {
    await this.write('a');
  }

  async addPromptAtEnd() {
    await this.write('A');
  }

  async insertPromptBefore() {
    await this.write('i');
  }

  async insertPromptAtStart() {
    await this.write('I');
  }

  async editPrompt() {
    await this.write('e');
  }

  async deletePrompt() {
    await this.write('d');
  }

  async archivePrompt() {
    await this.write('d');
  }

  async restorePrompt() {
    await this.write('r');
  }

  async pastePrompt() {
    await this.write('p');
  }

  async pastePromptCtrlV() {
    await this.write('\u0016'); // Ctrl-V
  }

  async save() {
    await this.write('\u0013');
  }

  async cancel() {
    await this.write('\u001B');
  }

  async confirm() {
    await this.write('\r');
  }

  async startSearch() {
    await this.write('/');
  }

  async startGlobalSearch() {
    await this.write('G');
  }

  async goToSettings() {
    await this.write('S');
  }

  async toggleItem() {
    await this.write(' ');
  }

  async undo() {
    await this.write('u');
  }

  async redo() {
    await this.write('\u0019'); // Ctrl-Y
  }

  async type(text: string) {
    await this.write(text);
  }

  async arrowRight() {
    await this.write('\u001b[C');
  }

  async arrowLeft() {
    await this.write('\u001b[D');
  }

  async arrowDown() {
    await this.write('\u001b[B');
  }

  async arrowUp() {
    await this.write('\u001b[A');
  }

  async waitForTextToAppear(text: string, timeout = 2000, interval = 20) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (this.frame?.includes(text)) {
        return;
      }
      await this.wait(interval);
    }
    throw new Error(`Timed out waiting for text "${text}" to appear. Current frame:\n${this.frame}`);
  }

  async waitForTextToDisappear(text: string, timeout = 2000, interval = 20) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (!this.frame?.includes(text)) {
        return;
      }
      await this.wait(interval);
    }
    throw new Error(`Timed out waiting for text "${text}" to disappear. Current frame:\n${this.frame}`);
  }

  // Assertions
  expectContent(text: string) {
    expect(this.frame).toContain(text);
  }

  expectNotContent(text: string) {
    expect(this.frame).not.toContain(text);
  }

  expectInEditor() {
    this.expectContent('Editor');
  }

  expectInViewer() {
    this.expectContent('Viewer');
  }

  expectTabActive(tabName: string) {
    this.expectContent(tabName);
  }

  // Advanced
  get frames() {
    return this.renderResult.frames;
  }

  rerender(ui: React.ReactElement) {
    this.renderResult.rerender(ui);
  }
}
