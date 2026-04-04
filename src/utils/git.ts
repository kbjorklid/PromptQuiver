import { execSync } from 'child_process';

export function getCurrentGitBranch(cwd: string): string | undefined {
  try {
    const output = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    const branch = output.trim();
    if (branch) {
      return branch;
    }
    return undefined;
  } catch (error) {
    // Not a git repository, or git is not installed, etc.
    return undefined;
  }
}
