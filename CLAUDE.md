# CLAUDE.md

## Documentation Guidelines
- Check `README.md` on any change to see if it needs updating. Keep documentation in sync with the current functionality.

## Testing Guidelines
- Always write automated tests whenever adding new functionality.
- For bug fixes, always follow a TDD (Test-Driven Development) approach:
  1. Write a failing test case that reproduces the bug.
  2. Implement the fix until the test passes.
  3. Ensure no regressions in existing tests.

## Release Process
1. **Bump Version:** Update `"version"` in `package.json`.
2. **Commit:** `git add package.json && git commit -m "chore: bump version to X.Y.Z"`
3. **Push:** `git push origin master`
4. **Tag & Trigger:** `git tag vX.Y.Z && git push origin vX.Y.Z`
   - The GitHub Action will automatically run tests, build binaries for all platforms, and create/update the GitHub Release with artifacts.
   - Avoid creating the release manually via `gh release create` or the UI before pushing the tag to prevent Action conflicts.
