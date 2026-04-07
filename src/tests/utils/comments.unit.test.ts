import { expect, test, describe } from "bun:test";
import { stripComments, getCommentTitle } from "../../utils/comments";

describe("stripComments", () => {
  test("removes lines starting with '--'", () => {
    const input = "Line 1\n-- A comment\nLine 2";
    const expected = "Line 1\nLine 2";
    expect(stripComments(input)).toBe(expected);
  });

  test("does not remove lines with '--' not at the start", () => {
    const input = "Line 1\nLine 2 -- not a comment";
    expect(stripComments(input)).toBe(input);
  });

  test("removes multiple comment lines", () => {
    const input = "-- Comment 1\n-- Comment 2\nLine 1\n-- Comment 3";
    const expected = "Line 1";
    expect(stripComments(input)).toBe(expected);
  });

  test("handles empty strings", () => {
    expect(stripComments("")).toBe("");
  });

  test("handles strings with only comments", () => {
    const input = "-- Comment 1\n-- Comment 2";
    expect(stripComments(input)).toBe("");
  });

  test("removes leading empty line when comment title is detected", () => {
    const input = "-- Title\n\nContent\n-- Comment";
    const expected = "Content";
    expect(stripComments(input)).toBe(expected);
  });
});

describe("getCommentTitle", () => {
  test("extracts title when followed by empty line", () => {
    const input = "-- My Title\n\nSome content";
    expect(getCommentTitle(input)).toBe("My Title");
  });

  test("does not extract title when NOT followed by empty line", () => {
    const input = "-- My Title\nSome content";
    expect(getCommentTitle(input)).toBeNull();
  });

  test("does not extract title when first line is not a comment", () => {
    const input = "Not a comment\n\nSome content";
    expect(getCommentTitle(input)).toBeNull();
  });

  test("handles multiple comments and empty line correctly", () => {
    const input = "-- Title 1\n-- Title 2\n\nContent";
    // First line is -- Title 1, second line is -- Title 2 (not empty)
    expect(getCommentTitle(input)).toBeNull();
  });

  test("trims whitespace from title", () => {
    const input = "--    My Title    \n\nContent";
    expect(getCommentTitle(input)).toBe("My Title");
  });
});
