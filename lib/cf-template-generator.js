/**
 * Simplified template generator for Cloudflare Workers
 * Since Three.js and JSDOM aren't available in CF Workers, we'll use a pre-generated template
 */

// This is a minimal template that mimics the structure of the original 3D-generated template
// Format kept for colorization: each path has both fill and stroke attributes (will be optimized during colorization)
export const CF_TEMPLATE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <filter id="outline" x="-5%" y="-5%" width="110%" height="110%">
      <feMorphology in="SourceAlpha" result="dilated" operator="dilate" radius="2"/>
      <feFlood flood-color="#000" result="color"/>
      <feComposite in="color" in2="dilated" operator="in" result="border"/>
      <feComposite in="SourceGraphic" in2="border" operator="over"/>
    </filter>
  </defs>
  <g id="stone-group" filter="url(#outline)" stroke-width=".2" stroke-linejoin="round">
    <!-- Base stone shapes - keep both fill and stroke for colorization processing -->
    <path d="M128 40C180 40 216 76 216 128S180 216 128 216 40 180 40 128 76 40 128 40Z" fill="rgb(100,100,100)" stroke="rgb(100,100,100)"/>
    <path d="M128 60C168 60 200 92 200 132S168 204 128 204 56 172 56 132 88 60 128 60Z" fill="rgb(120,120,120)" stroke="rgb(120,120,120)"/>
    <path d="M128 80C156 80 178 102 178 130S156 180 128 180 78 158 78 130 100 80 128 80Z" fill="rgb(140,140,140)" stroke="rgb(140,140,140)"/>
    <path d="M128 100C144 100 158 114 158 130S144 160 128 160 98 146 98 130 112 100 128 100Z" fill="rgb(160,160,160)" stroke="rgb(160,160,160)"/>
  </g>
</svg>`;

/**
 * Generate a template SVG string (in CF Worker, we use the pre-defined template)
 * @returns {string} SVG template string
 */
export async function generateCFTemplate() {
  // In Cloudflare Workers, we return our pre-defined template
  // since we can't run Three.js and JSDOM in the Worker environment
  return CF_TEMPLATE;
}