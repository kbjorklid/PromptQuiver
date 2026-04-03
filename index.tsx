import React from 'react';
import { render } from 'ink';
import { App } from './src/App';

const cwd = process.cwd();

render(<App cwd={cwd} />);
