import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const backendDir = join(rootDir, '..', 'backend');
const outputDir = join(rootDir, 'src', 'generated');

// Ensure output directory exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Check if OpenAPI spec exists
const specPath = join(backendDir, 'openapi.json');
if (!existsSync(specPath)) {
  console.log('OpenAPI spec not found. Generating...');
  execSync('pnpm generate:openapi', { cwd: backendDir, stdio: 'inherit' });
}

// Generate TypeScript client
console.log('Generating TypeScript client...');
execSync(
  `npx openapi-typescript-codegen --input ${specPath} --output ${outputDir} --client fetch --useOptions`,
  { cwd: rootDir, stdio: 'inherit' }
);

console.log('TypeScript client generated successfully!');

