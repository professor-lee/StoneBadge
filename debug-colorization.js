// Debug test to see why colorization isn't working
import { getStoneDNA } from './lib/colorizer.js';
import { CF_TEMPLATE } from './lib/cf-template-generator.js';
import { colorizeSVG } from './lib/colorizer.js';

console.log('Debugging SVG colorization...\n');

console.log('Original template:');
console.log(CF_TEMPLATE);

console.log('\nLooking for pattern: /fill="rgb\\((\\d+),(\\d+),(\\d+)\\)" stroke="rgb\\(\\d+,\\d+,\\d+\\"/g');

// Test the regex directly
const regex = /fill="rgb\((\d+),(\d+),(\d+)\)" stroke="rgb\(\d+,\d+,\d+\)"/g;
const matches = [...CF_TEMPLATE.matchAll(regex)];
console.log('\nRegex matches in original template:', matches.length);

// The issue is that our template doesn't have the stroke attribute
// Let's create a test template with the expected format
const testTemplate = CF_TEMPLATE.replace(/fill="rgb\((\d+),(\d+),(\d+)\)"/g, 
  (match, r, g, b) => `fill="rgb(${r},${g},${b})" stroke="rgb(${r},${g},${b})"`);

console.log('\nTest template with stroke attributes:');
console.log(testTemplate);

const matches2 = [...testTemplate.matchAll(regex)];
console.log('\nRegex matches in test template:', matches2.length);

// Now test colorization
const testSha = 'abcdef1';
const coloredSvg = colorizeSVG(testTemplate, testSha);
console.log('\nAfter colorization:');
console.log('Length difference:', testTemplate.length, '->', coloredSvg.length);
console.log('Has different colors:', coloredSvg !== testTemplate);

// Show a sample
const pathMatches = coloredSvg.match(/<path[^>]*>/g) || [];
console.log('\nFirst path after colorization:', pathMatches[0]);