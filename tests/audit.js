#!/usr/bin/env node

/**
 * Flowers For You - Repository Test & Audit Suite
 * Verifies consistency across index.html and all 50 flower experiences.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const PAGES_DIR = path.join(ROOT_DIR, 'pages');

console.log('========================================');
console.log('🌸 Flowers Repository Audit Suite');
console.log('========================================\n');

let failed = false;

// 1. Static Consistency Check
console.log('Phase 1: Validating file structure & gallery configuration...');
const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
const pageFiles = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html'));

console.log(`- Found ${pageFiles.length} pages in pages/ directory.`);
if (pageFiles.length !== 50) {
  console.error(`❌ Expected 50 pages, found ${pageFiles.length}`);
  failed = true;
}

// Extract flowers array from index.html
const flowersMatch = indexHtml.match(/const flowers = (\[[\s\S]*?\]);/);
if (!flowersMatch) {
  console.error('❌ Could not parse flowers array from index.html');
  process.exit(1);
}

const flowers = eval(flowersMatch[1]);
console.log(`- Parsed ${flowers.length} entries in flowers gallery list.`);
if (flowers.length !== 50) {
  console.error(`❌ Expected 50 flowers in index.html, found ${flowers.length}`);
  failed = true;
}

// Verify every link exists and every page is linked
const links = flowers.map(f => f.link);
const uniqueLinks = new Set(links);
if (uniqueLinks.size !== links.length) {
  console.error('❌ Duplicate links found in flowers array!');
  failed = true;
}

flowers.forEach((flower, i) => {
  const filePath = path.join(ROOT_DIR, flower.link);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ [Flower #${i + 1} "${flower.title}"] Missing target file: ${flower.link}`);
    failed = true;
  }
});

pageFiles.forEach(file => {
  const expectedLink = `pages/${file}`;
  if (!links.includes(expectedLink)) {
    console.error(`❌ File ${file} in pages/ is not referenced in index.html`);
    failed = true;
  }
});

if (!failed) {
  console.log('✓ All 50 flower pages are perfectly matched 1:1 with index.html!\n');
}

// 2. Syntax & Structural Audit of all 50 pages
console.log('Phase 2: Auditing HTML structure & script syntax across all 50 pages...');
let pageIssues = 0;

pageFiles.forEach((file, idx) => {
  const content = fs.readFileSync(path.join(PAGES_DIR, file), 'utf8');

  // Check CSS reference
  if (!content.includes('../css/style.css')) {
    console.error(`❌ [${file}] Missing stylesheet link (../css/style.css)`);
    pageIssues++;
  }

  // Check Three.js and utils.js
  if (!content.includes('three.min.js') && !content.includes('three.js')) {
    console.error(`❌ [${file}] Missing Three.js script`);
    pageIssues++;
  }
  if (!content.includes('../js/utils.js')) {
    console.error(`❌ [${file}] Missing utils.js script`);
    pageIssues++;
  }

  // Check canvas container and back button
  if (!content.includes('id="canvas-container"') && !content.includes("id='canvas-container'")) {
    console.error(`❌ [${file}] Missing canvas-container element`);
    pageIssues++;
  }
  if (!content.includes('class="back-btn"') && !content.includes("class='back-btn'")) {
    console.error(`❌ [${file}] Missing back-btn element`);
    pageIssues++;
  }
  if (!content.includes('FlowerUtils.hideLoading()')) {
    console.error(`❌ [${file}] Missing FlowerUtils.hideLoading() call`);
    pageIssues++;
  }

  // Validate JavaScript syntax in inline script
  const inlineScripts = [...content.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  inlineScripts.forEach((code, sIdx) => {
    try {
      new vm.Script(code);
    } catch (e) {
      console.error(`❌ [${file}] Syntax error in script #${sIdx + 1}: ${e.message}`);
      pageIssues++;
    }
  });
});

if (pageIssues === 0) {
  console.log('✓ All 50 flower pages passed HTML structural & JavaScript syntax verification!\n');
} else {
  failed = true;
  console.error(`❌ Found ${pageIssues} structural or syntax issues across flower pages.\n`);
}

// 3. Browser E2E verification if browser / puppeteer is available
console.log('Phase 3: Browser E2E WebGL Verification...');
let puppeteer;
try {
  puppeteer = require('/Users/shashwat/Desktop/repositories/bowling/node_modules/puppeteer-core');
} catch (e) {
  try {
    puppeteer = require('puppeteer-core');
  } catch (e2) {
    try {
      puppeteer = require('puppeteer');
    } catch (e3) {
      puppeteer = null;
    }
  }
}

const BRAVE_PATH = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
const hasBrave = fs.existsSync(BRAVE_PATH);

if (!puppeteer || !hasBrave) {
  console.log('ℹ️  Puppeteer or Brave Browser not directly available for headless E2E; skipping browser render pass.');
  console.log('Static audit completed successfully.');
  process.exit(failed ? 1 : 0);
}

const http = require('http');
const PORT = 8086;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/') p = '/index.html';
  const fp = path.join(ROOT_DIR, p);
  fs.readFile(fp, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end();
      return;
    }
    const ext = path.extname(fp);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: BRAVE_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--use-gl=angle']
    });

    // Test index.html
    const indexPage = await browser.newPage();
    const indexErrors = [];
    indexPage.on('pageerror', err => indexErrors.push(err.message));
    indexPage.on('console', msg => { if (msg.type() === 'error') indexErrors.push(msg.text()); });
    await indexPage.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 200));

    const firstState = await indexPage.evaluate(() => ({
      title: document.getElementById('flowerTitle').textContent,
      emoji: document.getElementById('mainFlower').textContent.trim(),
      viewHref: document.getElementById('viewBtn').getAttribute('href'),
      num: document.getElementById('currentNum').textContent
    }));

    if (firstState.title !== 'Mercury' || firstState.num !== '01') {
      console.error(`❌ Initial index.html state mismatch! Expected Mercury/01, got ${firstState.title}/${firstState.num}`);
      failed = true;
    } else {
      console.log(`✓ index.html initial state verified: #${firstState.num} ${firstState.title} (${firstState.emoji}) -> ${firstState.viewHref}`);
    }

    await indexPage.close();

    // Sample flower pages verification
    const samplePages = ['liquid-metal.html', 'photorealistic-rose.html', 'botanical-generator.html', 'interactive-garden.html'];
    for (const sp of samplePages) {
      const p = await browser.newPage();
      const pErrors = [];
      p.on('pageerror', err => pErrors.push(err.message));
      p.on('console', msg => { if (msg.type() === 'error') pErrors.push(msg.text()); });
      await p.goto(`http://localhost:${PORT}/pages/${sp}`, { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 1200));

      const hasCanvas = await p.evaluate(() => !!document.querySelector('canvas'));
      if (!hasCanvas || pErrors.length > 0) {
        console.error(`❌ [${sp}] Render check failed! errors:`, pErrors);
        failed = true;
      } else {
        console.log(`✓ [${sp}] WebGL canvas rendering cleanly with 0 errors.`);
      }
      await p.close();
    }

    await browser.close();
  } catch (err) {
    console.error('Browser testing error:', err);
    failed = true;
  } finally {
    server.close();
    if (failed) {
      console.error('\n❌ AUDIT FAILED');
      process.exit(1);
    } else {
      console.log('\n========================================');
      console.log('🎉 ALL AUDIT & INTEGRITY CHECKS PASSED!');
      console.log('========================================');
      process.exit(0);
    }
  }
});
