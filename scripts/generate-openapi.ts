/**
 * Generate OpenAPI JSON file from the swagger module.
 * Usage: npx tsx scripts/generate-openapi.ts
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';

async function main() {
  // Dynamic import to handle path aliases
  const { openApiDocument } = await import('../src/lib/swagger');

  const outputPath = resolve(__dirname, '../public/openapi.json');
  writeFileSync(outputPath, JSON.stringify(openApiDocument, null, 2), 'utf-8');

  console.log(`OpenAPI spec generated at: ${outputPath}`);
}

main().catch(console.error);
