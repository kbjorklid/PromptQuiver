import React from 'react';
import { render } from 'ink';
import { App } from './src/App';

const ENTER_ALTERNATIVE_SCREEN = '\u001b[?1049h\u001b[H\u001b[2J';
const EXIT_ALTERNATIVE_SCREEN = '\u001b[?1049l';

process.stdout.write(ENTER_ALTERNATIVE_SCREEN);

const cleanup = () => {
  process.stdout.write(EXIT_ALTERNATIVE_SCREEN);
};

// Ensure cleanup on various exit conditions
process.on('exit', cleanup);
process.on('SIGINT', () => {
  process.exit();
});

const cwd = process.cwd();
const { waitUntilExit } = render(<App cwd={cwd} />);

waitUntilExit().then(() => {
  // cleanup will be called by 'exit' event
});
