// Test script to validate SVG optimization
import { getStoneDNA } from './lib/colorizer.js';
import { CF_TEMPLATE } from './lib/cf-template-generator.js';
import { colorizeSVG } from './lib/colorizer.js';

console.log('Testing SVG optimization...\n');

// Test the original template
console.log('1. Original template stats:');
console.log('   Length:', CF_TEMPLATE.length);

// Test with a sample SHA
const testSha = 'abcdef1';
const coloredSvg = colorizeSVG(CF_TEMPLATE, testSha);
console.log('   Colored SVG length:', coloredSvg.length);

// Display a snippet of the colored SVG
console.log('\n2. Sample of colored SVG:');
const startIdx = coloredSvg.indexOf('<path');
const endIdx = coloredSvg.indexOf('</g>', startIdx);
console.log(coloredSvg.substring(startIdx, Math.min(endIdx, startIdx + 200)) + '...');

// Count number of path elements
const pathCount = (coloredSvg.match(/<path/g) || []).length;
console.log('\n3. Path elements count:', pathCount);

// Test optimization by removing duplicate attributes
function optimizeSVG(svg) {
  // Remove duplicate stroke attributes when they match fill
  return svg.replace(/fill="([^"]+)" stroke="\1"/g, 'fill="$1"');
}

const optimizedSvg = optimizeSVG(coloredSvg);
console.log('\n4. After optimization:');
console.log('   Original length:', coloredSvg.length);
console.log('   Optimized length:', optimizedSvg.length);
console.log('   Reduction:', coloredSvg.length - optimizedSvg.length, 'characters');

console.log('\n✅ Optimization test completed!');