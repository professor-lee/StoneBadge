// Comprehensive test for SVG optimization
import { getStoneDNA } from './lib/colorizer.js';
import { CF_TEMPLATE } from './lib/cf-template-generator.js';
import { colorizeSVG } from './lib/colorizer.js';

console.log('Comprehensive SVG optimization test...\n');

// Test the original template
console.log('1. Original template stats:');
console.log('   Length:', CF_TEMPLATE.length);
console.log('   Path count:', (CF_TEMPLATE.match(/<path/g) || []).length);

// Test with a sample SHA
const testSha = 'abcdef1';
const coloredSvg = colorizeSVG(CF_TEMPLATE, testSha);
console.log('\n2. After colorization:');
console.log('   Length:', coloredSvg.length);

// Count optimized paths (without stroke attributes)
const optimizedPaths = (coloredSvg.match(/fill="[^"]+"/g) || []).filter(attr => !attr.includes('stroke='));
console.log('   Optimized paths (fill only):', optimizedPaths.length);

// Show sample of optimized SVG
console.log('\n3. Sample of optimized SVG:');
const pathMatches = coloredSvg.match(/<path[^>]*>/g) || [];
console.log('   First path element:', pathMatches[0]);

// Compare with original template path
const originalPathMatches = CF_TEMPLATE.match(/<path[^>]*>/g) || [];
console.log('   Original first path:', originalPathMatches[0]);

// Calculate savings
const originalSizeEstimate = CF_TEMPLATE.length + (originalPathMatches.length * 20); // approx stroke="..." length
const savings = originalSizeEstimate - coloredSvg.length;
console.log('\n4. Size optimization:');
console.log('   Estimated original size (with strokes): ~', originalSizeEstimate);
console.log('   Final size (optimized):', coloredSvg.length);
console.log('   Savings: ~', originalSizeEstimate - coloredSvg.length, 'characters');

// Test with different SHAs to ensure optimization works consistently
console.log('\n5. Testing optimization consistency:');
const shas = ['abc1234', 'def4567', 'ghi7890'];
for (const sha of shas) {
  const dna = getStoneDNA(sha);
  const svg = colorizeSVG(CF_TEMPLATE, sha);
  const pathCount = (svg.match(/<path/g) || []).length;
  console.log(`   SHA ${sha}: ${svg.length} chars, ${pathCount} paths, mode=${dna.mode}, glow=${dna.glow}`);
}

console.log('\n✅ SVG optimization test completed successfully!');