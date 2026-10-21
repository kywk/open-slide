#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

let supportsPele = () => true;
try {
  const pele = await import('pele').catch(
    () => import('../packages/core/node_modules/pele/dist/pele.js'),
  );
  if (pele?.supports) {
    supportsPele = pele.supports;
  }
} catch {
  // pele validation optional if running without dependencies
}

const args = process.argv.slice(2);
const fix = args.includes('--fix') || args.includes('--write');
const targetDir = args.find((a) => !a.startsWith('--')) || 'slides';

function findFiles(dir, exts = ['.tsx', '.jsx', '.ts', '.js']) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
        files.push(...findFiles(fullPath, exts));
      }
    } else if (exts.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function scanAndMigrate(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('Mermaid') && !content.includes('mermaid')) {
    return null;
  }

  const issues = [];
  let updated = content;

  // 1. Detect `import type { MermaidConfig } from 'mermaid'` or similar
  const mermaidImportMatch = content.match(
    /import\s+(?:type\s+)?\{[^}]*MermaidConfig[^}]*\}\s+from\s+['"][^'"]+['"]/,
  );
  if (mermaidImportMatch) {
    issues.push({
      type: 'MERMAID_CONFIG_IMPORT',
      message: 'Imports MermaidConfig (legacy config is deprecated; Pele uses CSS variables).',
    });
    if (fix) {
      updated = updated.replace(
        /import\s+(?:type\s+)?\{([^}]*)\bMermaidConfig\b([^}]*)\}\s+from\s+['"][^'"]+['"];?\n?/,
        (_match, before, after) => {
          const rest = `${before}${after}`
            .replace(/,\s*,/g, ',')
            .replace(/^\s*,\s*|\s*,\s*$/g, '')
            .trim();
          if (!rest) return '';
          return `import type { ${rest} } from '@kywk/open-slide-core';\n`;
        },
      );
    }
  }

  // 2. Detect `config={...}` on <Mermaid />
  const configPropMatches = [...content.matchAll(/<Mermaid\b[^>]*\bconfig=\{([^}]+)\}/g)];
  const configVarNames = new Set();
  if (configPropMatches.length > 0) {
    for (const match of configPropMatches) {
      const configVarName = match[1].trim();
      configVarNames.add(configVarName);
      issues.push({
        type: 'CONFIG_PROP',
        message: `<Mermaid> passes legacy config={${configVarName}}. Diagram styles are now controlled via CSS variables (--pele-* / --osd-*).`,
      });
    }
    if (fix) {
      updated = updated.replace(/\s+config=\{[^}]+\}/g, '');
    }
  }

  // 3. Detect obsolete `const <configVarName> = ...`
  if (fix) {
    const toCheck = new Set(['mermaidConfig', ...configVarNames]);
    for (const varName of toCheck) {
      const declRegex = new RegExp(
        `(?:const|let|var)\\s+${varName}\\s*=\\s*\\{[\\s\\S]*?\\}\\s*(?:as\\s+const)?\\s*;?\\n?`,
      );
      if (declRegex.test(updated)) {
        const remainingRefs = (updated.match(new RegExp(`\\b${varName}\\b`, 'g')) || []).length;
        if (remainingRefs <= 1) {
          updated = updated.replace(declRegex, '');
          issues.push({
            type: 'REMOVED_MERMAID_CONFIG',
            message: `Removed unused \`${varName}\` object.`,
          });
        }
      }
    }
  }

  // 4. Scan chart strings for potential syntax / unsupported features
  const chartLiteralRegex = /(?:const\s+\w+\s*=\s*|chart=\{?)(`[\s\S]*?`)/g;
  for (const match of content.matchAll(chartLiteralRegex)) {
    const chartSource = match[1].slice(1, -1).trim();
    if (
      /^(flowchart|sequenceDiagram|stateDiagram|classDiagram|erDiagram|gantt|pie|gitGraph|journey|quadrantChart|xychart)/m.test(
        chartSource,
      )
    ) {
      if (!supportsPele(chartSource)) {
        issues.push({
          type: 'PELE_SYNTAX_WARNING',
          message: 'Mermaid chart may contain syntax unsupported by Pele. Test diagram rendering.',
        });
      }
      if (/click\s+\w+\s+(?:call|callback)/.test(chartSource)) {
        issues.push({
          type: 'INTERACTIVE_CALLBACK',
          message: 'Chart contains interactive `click` callbacks which Pele does not execute.',
        });
      }
    }
  }

  if (issues.length > 0) {
    if (fix && updated !== content) {
      fs.writeFileSync(filePath, updated, 'utf8');
    }
    return { filePath, issues, fixed: fix && updated !== content };
  }
  return null;
}

const files = findFiles(targetDir);
console.log(
  `Scanning ${files.length} file(s) in '${targetDir}' for Mermaid -> Pele dependencies...\n`,
);

let totalIssues = 0;
const results = [];

for (const file of files) {
  const result = scanAndMigrate(file);
  if (result) {
    results.push(result);
    totalIssues += result.issues.length;
    console.log(`\x1b[36m${path.relative(process.cwd(), result.filePath)}\x1b[0m`);
    for (const issue of result.issues) {
      console.log(`  - [${issue.type}] ${issue.message}`);
    }
    if (result.fixed) {
      console.log('  \x1b[32m✔ Auto-migrated\x1b[0m');
    }
    console.log();
  }
}

if (results.length === 0) {
  console.log('\x1b[32mNo legacy Mermaid dependencies found.\x1b[0m');
} else {
  console.log(`\nSummary: Found ${totalIssues} issue(s) across ${results.length} file(s).`);
  if (!fix) {
    console.log('Run with `--fix` to automatically clean up obsolete config props and imports.');
  }
}
