const fs = require('fs');
const path = require('path');

const dir = 'src/tests/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Replace render(<App ... />) where viewportSize is missing
  // Matches render( followed by optional whitespace then <App, then anything non-greedy until /> )
  content = content.replace(/render\(\s*<App([\s\S]*?)\/>\s*\)/g, (match, p1) => {
    if (p1.includes('viewportSize')) {
      return match;
    }
    changed = true;
    // Remove trailing whitespace from the inner props string and add viewportSize
    const updatedProps = p1.replace(/\s+$/, '');
    return `render(<App${updatedProps} viewportSize={5} />)`;
  });

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  } else {
    // console.log(`No changes needed for ${file}`);
  }
});
