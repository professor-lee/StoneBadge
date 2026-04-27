/**
 * Simplified template generator for Cloudflare Workers
 * Since Three.js and JSDOM aren't available in CF Workers, we'll use a pre-generated template
 */

// This is a template that mimics the structure of the original 3D-generated template
// Includes animated rotation effect using SVG animations to simulate the rotating stone
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
    <!-- Multiple frames for rotation animation -->
    <g transform="rotate(0 128 128)" style="opacity: 1;">
      <animateTransform attributeName="transform" type="rotate" 
        values="0 128 128; 120 128 128; 240 128 128; 0 128 128" 
        dur="10s" repeatCount="indefinite"/>
      <!-- Stone shape with perspective to simulate 3D -->
      <path d="M128 60C160 65 190 95 190 130C190 165 160 195 128 200C96 195 66 165 66 130C66 95 96 65 128 60Z" fill="rgb(100,100,100)" stroke="rgb(100,100,100)"/>
      <path d="M128 70C150 75 170 100 170 125C170 150 150 175 128 180C106 175 86 150 86 125C86 100 106 75 128 70Z" fill="rgb(120,120,120)" stroke="rgb(120,120,120)"/>
      <path d="M128 80C140 85 155 105 155 125C155 145 140 165 128 170C116 165 101 145 101 125C101 105 116 85 128 80Z" fill="rgb(140,140,140)" stroke="rgb(140,140,140)"/>
      <path d="M128 90C135 94 145 110 145 125C145 140 135 156 128 160C121 156 111 140 111 125C111 110 121 94 128 90Z" fill="rgb(160,160,160)" stroke="rgb(160,160,160)"/>
    </g>
    <!-- Additional frame for more complex animation -->
    <g transform="rotate(120 128 128)" style="opacity: 0;">
      <animateTransform attributeName="transform" type="rotate" 
        values="120 128 128; 240 128 128; 0 128 128; 120 128 128" 
        dur="10s" begin="0s" repeatCount="indefinite"/>
      <path d="M128 60C160 65 190 95 190 130C190 165 160 195 128 200C96 195 66 165 66 130C66 95 96 65 128 60Z" fill="rgb(110,110,110)" stroke="rgb(110,110,110)"/>
      <path d="M128 70C150 75 170 100 170 125C170 150 150 175 128 180C106 175 86 150 86 125C86 100 106 75 128 70Z" fill="rgb(130,130,130)" stroke="rgb(130,130,130)"/>
      <path d="M128 80C140 85 155 105 155 125C155 145 140 165 128 170C116 165 101 145 101 125C101 105 116 85 128 80Z" fill="rgb(150,150,150)" stroke="rgb(150,150,150)"/>
      <path d="M128 90C135 94 145 110 145 125C145 140 135 156 128 160C121 156 111 140 111 125C111 110 121 94 128 90Z" fill="rgb(170,170,170)" stroke="rgb(170,170,170)"/>
    </g>
    <!-- Third frame -->
    <g transform="rotate(240 128 128)" style="opacity: 0;">
      <animateTransform attributeName="transform" type="rotate" 
        values="240 128 128; 0 128 128; 120 128 128; 240 128 128" 
        dur="10s" begin="0s" repeatCount="indefinite"/>
      <path d="M128 60C160 65 190 95 190 130C190 165 160 195 128 200C96 195 66 165 66 130C66 95 96 65 128 60Z" fill="rgb(90,90,90)" stroke="rgb(90,90,90)"/>
      <path d="M128 70C150 75 170 100 170 125C170 150 150 175 128 180C106 175 86 150 86 125C86 100 106 75 128 70Z" fill="rgb(110,110,110)" stroke="rgb(110,110,110)"/>
      <path d="M128 80C140 85 155 105 155 125C155 145 140 165 128 170C116 165 101 145 101 125C101 105 116 85 128 80Z" fill="rgb(130,130,130)" stroke="rgb(130,130,130)"/>
      <path d="M128 90C135 94 145 110 145 125C145 140 135 156 128 160C121 156 111 140 111 125C111 110 121 94 128 90Z" fill="rgb(150,150,150)" stroke="rgb(150,150,150)"/>
    </g>
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