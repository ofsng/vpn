const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'dist', 'index.html');

try {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Remove duplicate script tags
  const scriptMatches = content.match(/<script[^>]*src="[^"]*"[^>]*><\/script>/g);
  
  if (scriptMatches) {
    const uniqueScripts = [...new Set(scriptMatches)];
    
    // Remove all scripts first
    content = content.replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, '');
    
    // Add unique scripts back before closing body tag
    const scriptsHtml = uniqueScripts.join('\n');
    content = content.replace('</body>', scriptsHtml + '\n</body>');
    
    fs.writeFileSync(indexPath, content);
    console.log('✅ Duplicate scripts fixed successfully!');
    console.log(`Removed ${scriptMatches.length - uniqueScripts.length} duplicate scripts`);
  } else {
    console.log('No scripts found in index.html');
  }
} catch (error) {
  console.error('❌ Error fixing duplicate scripts:', error.message);
  process.exit(1);
}