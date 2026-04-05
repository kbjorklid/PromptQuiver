import { calculateViewport, getItemHeight, getItemTextHeight } from '../hooks/useViewport';
import { expect, test, describe } from 'bun:test';

describe('getItemHeight', () => {
  test('returns 2 for named prompt', () => {
    expect(getItemHeight({ name: 'Foo', text: 'Bar\nBaz\nQux' })).toBe(2);
  });
  test('returns 2 for 1-line prompt', () => {
    expect(getItemHeight({ text: 'Bar' })).toBe(2);
  });
  test('returns 3 for 2-line prompt', () => {
    expect(getItemHeight({ text: 'Bar\nBaz' })).toBe(3);
  });
  test('returns 3 for multi-line prompt', () => {
    expect(getItemHeight({ text: 'Bar\nBaz\nQux' })).toBe(3);
  });
  test('returns 2 for empty prompt', () => {
    expect(getItemHeight({ text: ' ' })).toBe(2);
  });
});

describe('getItemTextHeight', () => {
  test('returns 1 for named prompt', () => {
    expect(getItemTextHeight({ name: 'Foo', text: 'Bar\nBaz\nQux' })).toBe(1);
  });
  test('returns 1 for 1-line prompt', () => {
    expect(getItemTextHeight({ text: 'Bar' })).toBe(1);
  });
  test('returns 2 for 2-line prompt', () => {
    expect(getItemTextHeight({ text: 'Bar\nBaz' })).toBe(2);
  });
  test('returns 2 for multi-line prompt', () => {
    expect(getItemTextHeight({ text: 'Bar\nBaz\nQux' })).toBe(2);
  });
  test('returns 1 for empty prompt', () => {
    expect(getItemTextHeight({ text: ' ' })).toBe(1);
  });
});

describe('calculateViewport', () => {
  const shortItem = { text: '1' }; // text height: 1
  const tallItem = { text: '1\n2' }; // text height: 2

  test('calculates correct indices for small list', () => {
    const list = [shortItem, shortItem, shortItem];
    const result = calculateViewport({ list, selectedIndex: 0, terminalRows: 20, initialViewportSize: 5 });
    expect(result.start).toBe(0);
    expect(result.end).toBe(3);
    expect(result.viewportSize).toBe(5);
  });

  test('calculates correct indices for top selection in large list', () => {
    const list = Array(10).fill(shortItem);
    const result = calculateViewport({ list, selectedIndex: 0, terminalRows: 20, initialViewportSize: 5 });
    expect(result.start).toBe(0);
    expect(result.end).toBe(5);
  });

  test('calculates correct indices for middle selection in large list', () => {
    const list = Array(10).fill(shortItem);
    const result = calculateViewport({ list, selectedIndex: 5, terminalRows: 20, initialViewportSize: 5 });
    expect(result.start).toBe(3);
    expect(result.end).toBe(8);
  });

  test('calculates correct indices for bottom selection in large list', () => {
    const list = Array(10).fill(shortItem);
    const result = calculateViewport({ list, selectedIndex: 9, terminalRows: 20, initialViewportSize: 5 });
    expect(result.start).toBe(5);
    expect(result.end).toBe(10);
  });

  test('calculates dynamic viewport size from terminal rows with short items', () => {
    const list = Array(20).fill(shortItem);
    // Overhead is 11. availableLines = 30 - 11 = 19.
    // 1st item: 1 line
    // each additional item: 2 lines (1 text + 1 sep)
    // 19 lines = 1 (first item) + 18 lines = 1 + 9 items = 10 items.
    const result = calculateViewport({ list, selectedIndex: 10, terminalRows: 30 });
    expect(result.viewportSize).toBe(10);
    expect(result.start).toBe(6);
    expect(result.end).toBe(16);
  });

  test('calculates dynamic viewport size from terminal rows with tall items', () => {
    const list = Array(20).fill(tallItem);
    // Overhead is 11. availableLines = 30 - 11 = 19.
    // 1st item: 2 lines
    // each additional item: 3 lines (2 text + 1 sep)
    // 19 lines = 2 (first) + 17 lines -> 15 lines (5 items) -> total 6 items (takes 2 + 15 = 17 lines).
    const result = calculateViewport({ list, selectedIndex: 10, terminalRows: 30 });
    expect(result.viewportSize).toBe(6);
    expect(result.start).toBe(8);
    expect(result.end).toBe(14);
  });
});
