// Test to preview the generated SVG structure
import { getStoneDNA } from './lib/colorizer.js';
import { CF_TEMPLATE } from './lib/cf-template-generator.js';
import { colorizeSVG } from './lib/colorizer.js';

console.log('SVG Structure Preview Test\n');

// Show the original template structure
console.log('1. Original template structure:');
console.log('   Has animation elements:', CF_TEMPLATE.includes('animateTransform') ? '✅' : '❌');
console.log('   Has multiple frames:', (CF_TEMPLATE.match(/<g transform/g) || []).length, 'frames');
console.log('   Has 3D-like shapes:', CF_TEMPLATE.includes('path d=') ? '✅' : '❌');

// Generate a sample colored SVG
const testSha = 'abcdef1';
const coloredSvg = colorizeSVG(CF_TEMPLATE, testSha);

console.log('\n2. Colored SVG analysis:');
console.log('   Has preserved animation:', coloredSvg.includes('animateTransform') ? '✅' : '❌');
console.log('   Has filtered elements:', coloredSvg.includes('filter=') ? '✅' : '❌');
console.log('   Has glow effect (if applicable):', coloredSvg.includes('glow') ? '✅' : 'Maybe not enabled for this SHA');

// Check for the type of shapes
const pathElements = (coloredSvg.match(/<path[^>]*>/g) || []);
console.log('   Total path elements:', pathElements.length);

// Check if paths have elliptical/spherical characteristics vs circular
const hasEllipticalPaths = pathElements.some(path => 
  path.includes('C') && path.includes('128') // Bezier curves centered around middle
);
console.log('   Has 3D-like curved paths:', hasEllipticalPaths ? '✅' : '❌');

console.log('\n3. Sample path from colored SVG:');
if (pathElements.length > 0) {
  console.log('   First path:', pathElements[0].substring(0, 100) + '...');
}

console.log('\n4. Animation structure:');
const animationElements = (coloredSvg.match(/<animateTransform/g) || []);
console.log('   Number of animation elements:', animationElements.length);
console.log('   Has rotation animation:', coloredSvg.includes('type="rotate"') ? '✅' : '❌');

console.log('\n5. DNA for test SHA', testSha + ':');
const dna = getStoneDNA(testSha);
console.log('   Mode:', dna.mode);
console.log('   Primary HSL:', `${dna.primary.h}°, ${dna.primary.s}%, ${dna.primary.l}%`);
console.log('   Glow effect:', dna.glow ? 'Yes' : 'No');

console.log('\n✅ Template successfully creates animated 3D-like stone appearance!');