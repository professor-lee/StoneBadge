import fs from 'fs';

/**
 * 三元奇点折叠 + HSL安全域算法，根据 short SHA 生成石墩子颜色DNA
 */
function getStoneDNA(sha) {
  const hex = (start, end) => parseInt(sha.substring(start, end), 16);

  // 1. 形态判定：三元奇点折叠 (SHA[0:3])
  const c1 = hex(0, 1);
  const c2 = hex(1, 2);
  const c3 = hex(2, 3);
  const foldResult = ((c1 ^ ((c2 << 4 | c2 >> 4) & 0xFF)) + c3) ^ 0x5A;
  const isMulti = (foldResult & 1) === 1;

  // 2. 色相映射：全局色环定位 (SHA[3:5])
  const h = Math.round((hex(3, 5) / 255) * 360);

  // 3. 饱和度与亮度控制：安全域算法 (SHA[5:7])
  const s = Math.round(55 + (hex(5, 6) / 15) * 30); // 55-85%
  const l = Math.round(35 + (hex(6, 7) / 15) * 30); // 35-65%

  // 4. 辅助色生成：黄金角度偏移
  let secondaryH = h;
  if (isMulti) {
    const lastDigit = hex(6, 7);
    const offset = (lastDigit % 2 === 0) ? 30 : 150;
    secondaryH = (h + offset) % 360;
  }

  // 5. 发光效果
  const isGlowing = hex(6, 7) > 12;

  return {
    primary: { h, s, l },
    secondary: { h: secondaryH, s, l },
    mode: isMulti ? 'gradient' : 'solid',
    glow: isGlowing
  };
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r, g, b;

  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

function lerpHue(h1, h2, t) {
  let diff = h2 - h1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return ((h1 + diff * t) % 360 + 360) % 360;
}

function grayPathToColoredAttrs(r, g, b, dna) {
  const luminance = (r + g + b) / (3 * 255);
  let targetH, targetS;
  if (dna.mode === 'gradient') {
    targetH = lerpHue(dna.secondary.h, dna.primary.h, luminance);
    targetS = dna.primary.s;
  } else {
    targetH = dna.primary.h;
    targetS = dna.primary.s;
  }
  const targetL = 15 + luminance * 60;
  const rgb = hslToRgb(targetH, targetS, targetL);
  return `fill="rgb(${rgb.r},${rgb.g},${rgb.b})" stroke="rgb(${rgb.r},${rgb.g},${rgb.b})"`;
}

export function colorizeSVG(templatePath, sha) {
  let svg = fs.readFileSync(templatePath, 'utf-8');
  const dna = getStoneDNA(sha);

  // 旧模板：rgb + 同值 stroke；新模板：灰度 #rrggbb + stroke="none"
  svg = svg.replace(
    /fill="rgb\((\d+),(\d+),(\d+)\)" stroke="rgb\(\d+,\d+,\d+\)"/g,
    (_, rStr, gStr, bStr) =>
      grayPathToColoredAttrs(parseInt(rStr), parseInt(gStr), parseInt(bStr), dna)
  );
  svg = svg.replace(
    /fill="#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})" stroke="none"/g,
    (match, a, b, c) => {
      const r = parseInt(a, 16), g = parseInt(b, 16), bl = parseInt(c, 16);
      if (r !== g || g !== bl) return match;
      return grayPathToColoredAttrs(r, g, bl, dna);
    }
  );

  // 添加发光效果（追加到已有的 <defs> 中，并在 stone-group 上叠加 glow 滤镜）
  if (dna.glow) {
    svg = svg.replace(
      '</filter></defs>',
      `</filter>` +
      `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">` +
      `<feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur"/>` +
      `<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>` +
      `</filter></defs>`
    );
    // 在 outline 滤镜后叠加 glow：用一个外层 <g> 包裹
    svg = svg.replace(
      '<g id="stone-group"',
      `<g filter="url(#glow)"><g id="stone-group"`
    );
    svg = svg.replace('</svg>', '</g></svg>');
  }

  return svg;
}

export { getStoneDNA };
