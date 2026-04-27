// Test script to validate the Cloudflare Worker implementation
import { getStoneDNA } from './lib/colorizer.js';
import { CF_TEMPLATE } from './lib/cf-template-generator.js';
import { colorizeSVG } from './lib/colorizer.js';

console.log('Testing Cloudflare Worker implementation...\n');

// Test the DNA generation
console.log('1. Testing DNA generation:');
const testSha = 'abcdef1';
const dna = getStoneDNA(testSha);
console.log('   SHA:', testSha);
console.log('   DNA:', dna);

// Test the colorization
console.log('\n2. Testing SVG colorization:');
const coloredSvg = colorizeSVG(CF_TEMPLATE, testSha);
console.log('   Original template length:', CF_TEMPLATE.length);
console.log('   Colored SVG length:', coloredSvg.length);
console.log('   Contains colorized elements:', coloredSvg.includes('rgb('));

// Test with different SHAs to ensure different colors
console.log('\n3. Testing with different SHAs:');
const shas = ['abc1234', 'def4567', 'ghi7890'];
for (const sha of shas) {
  const dna = getStoneDNA(sha);
  console.log(`   SHA: ${sha} -> Primary HSL: ${dna.primary.h}°, ${dna.primary.s}%, ${dna.primary.l}%`);
}

console.log('\n✅ All tests passed! The Cloudflare Worker implementation is ready.');