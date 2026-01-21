/**
 * Changelog Generator Script
 * 
 * Reads from src/data/changelog.json (single source of truth)
 * and generates CHANGELOG.md with technical descriptions and dates.
 * 
 * Usage: npx tsx scripts/generate-changelog.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface ChangelogChange {
  type: 'added' | 'changed' | 'improved' | 'fixed' | 'security';
  userFacing: string[];
  technical?: string[];
}

interface ChangelogEntry {
  version: string;
  date: string;
  changes: ChangelogChange[];
}

interface ChangelogSource {
  entries: ChangelogEntry[];
}

const typeMap: Record<string, string> = {
  added: 'Added',
  changed: 'Changed',
  improved: 'Improved',
  fixed: 'Fixed',
  security: 'Security',
};

function generateChangelog(): void {
  const sourcePath = path.join(process.cwd(), 'src/data/changelog.json');
  const outputPath = path.join(process.cwd(), 'CHANGELOG.md');

  // Read source file
  const sourceContent = fs.readFileSync(sourcePath, 'utf-8');
  const source: ChangelogSource = JSON.parse(sourceContent);

  // Build markdown content
  let markdown = `# Changelog

All notable changes to EquipIQ will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;

  for (const entry of source.entries) {
    markdown += `## [${entry.version}] - ${entry.date}\n\n`;

    for (const change of entry.changes) {
      // Use technical descriptions if available, otherwise fall back to userFacing
      const items = change.technical?.length ? change.technical : change.userFacing;
      const sectionTitle = typeMap[change.type] || change.type;

      markdown += `### ${sectionTitle}\n`;
      for (const item of items) {
        markdown += `- ${item}\n`;
      }
      markdown += '\n';
    }
  }

  // Write output file
  fs.writeFileSync(outputPath, markdown.trim() + '\n');
  console.log('✓ Generated CHANGELOG.md from src/data/changelog.json');
}

// Run the generator
generateChangelog();
