import { calculateViewport } from '../hooks/useViewport';
import { expect, test, describe } from 'bun:test';

describe('calculateViewport', () => {
  test('calculates correct indices for small list', () => {
    const result = calculateViewport({ totalItems: 3, selectedIndex: 0, terminalRows: 20, initialViewportSize: 5 });
    expect(result.start).toBe(0);
    expect(result.end).toBe(3);
    expect(result.viewportSize).toBe(5);
  });

  test('calculates correct indices for top selection in large list', () => {
    const result = calculateViewport({ totalItems: 10, selectedIndex: 0, terminalRows: 20, initialViewportSize: 5 });
    expect(result.start).toBe(0);
    expect(result.end).toBe(5);
  });

  test('calculates correct indices for middle selection in large list', () => {
    const result = calculateViewport({ totalItems: 10, selectedIndex: 5, terminalRows: 20, initialViewportSize: 5 });
    // half of 5 is 2. start = 5 - 2 = 3. end = 3 + 5 = 8.
    expect(result.start).toBe(3);
    expect(result.end).toBe(8);
  });

  test('calculates correct indices for bottom selection in large list', () => {
    const result = calculateViewport({ totalItems: 10, selectedIndex: 9, terminalRows: 20, initialViewportSize: 5 });
    // half of 5 is 2. start = 9 - 2 = 7. end = 7 + 5 = 12.
    // end = min(10, 12) = 10.
    // end-start = 3 < 5. start = max(0, 10 - 5) = 5.
    expect(result.start).toBe(5);
    expect(result.end).toBe(10);
  });

  test('calculates viewport size from terminal rows', () => {
    const result = calculateViewport({ totalItems: 20, selectedIndex: 10, terminalRows: 30 });
    // viewportSize = max(3, 30 - 15) = 15.
    expect(result.viewportSize).toBe(15);
    // half = 7. start = 10 - 7 = 3. end = 3 + 15 = 18.
    expect(result.start).toBe(3);
    expect(result.end).toBe(18);
  });
});
