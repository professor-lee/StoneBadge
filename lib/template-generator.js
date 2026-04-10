import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANIM_DURATION = 10;
const TILT_ANGLE = 30 * Math.PI / 180;
const CAM_ELEVATION = 10 * Math.PI / 180;
const OUTLINE_RADIUS = 2;  // 外轮廓粗细(px)

/** 默认与 /api 校验共用 */
export const DEFAULT_GENERATE_OPTIONS = {
  frameCount: 20,
  minFaceArea: 1.2,
  simplifyCollapses: 0,
  animDuration: ANIM_DURATION
};

/**
 * 校验并合并生成参数（帧数、投影最小面积、网格减面迭代次数）
 */
export function clampGenerateOptions(raw = {}) {
  const frameCount = Math.min(
    32,
    Math.max(8, Math.round(Number(raw.frameCount ?? raw.frames ?? raw.f) || DEFAULT_GENERATE_OPTIONS.frameCount))
  );
  const minFaceArea = Math.min(
    6,
    Math.max(0.25, Number(raw.minFaceArea ?? raw.minArea ?? raw.a) || DEFAULT_GENERATE_OPTIONS.minFaceArea)
  );
  const simplifyCollapses = Math.min(
    3000,
    Math.max(0, Math.round(Number(raw.simplifyCollapses ?? raw.simplify ?? raw.s) || 0))
  );
  const animDuration = Math.min(
    60,
    Math.max(4, Number(raw.animDuration) || DEFAULT_GENERATE_OPTIONS.animDuration)
  );
  return { frameCount, minFaceArea, simplifyCollapses, animDuration };
}

/**
 * 多帧 3D 倾斜旋转 SVG 模板生成器
 * 外轮廓通过 SVG feMorphology 滤镜自动生成（仅模型与背景边界处）
 */
export async function generateTemplate(outputPath, options = {}) {
  const opts = { ...DEFAULT_GENERATE_OPTIONS, ...clampGenerateOptions(options) };
  const FRAME_COUNT = opts.frameCount;
  const MIN_FACE_AREA = opts.minFaceArea;
  const animDur = opts.animDuration;
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { pretendToBeVisual: true });
  const { window } = dom;
  const globals = {
    window, document: window.document,
    navigator: window.navigator, self: window,
    HTMLElement: window.HTMLElement, Element: window.Element, Node: window.Node,
    DOMParser: window.DOMParser, XMLSerializer: window.XMLSerializer,
    requestAnimationFrame: (cb) => setTimeout(cb, 16), cancelAnimationFrame: clearTimeout,
  };
  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
  }

  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { SimplifyModifier } = await import('three/addons/modifiers/SimplifyModifier.js');

  const W = 256, H = 256;

  const modelPath = path.join(__dirname, '..', 'seatstone.glb');
  if (!fs.existsSync(modelPath)) throw new Error(`模型文件不存在: ${modelPath}`);
  const buf = fs.readFileSync(modelPath);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.parse(ab, '', (gltf) => {
      try {
        const model = gltf.scene;

        // 居中 + 缩放
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) model.scale.setScalar(2.0 / maxDim);
        model.updateMatrixWorld(true);
        const scaledBox = new THREE.Box3().setFromObject(model);
        const center = scaledBox.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // 倾斜模型
        model.rotation.x = TILT_ANGLE;
        model.updateMatrixWorld(true);

        // 网格减面（SimplifyModifier 的 count 为边折叠迭代次数）
        const collapseN = opts.simplifyCollapses;
        if (collapseN > 0) {
          const modifier = new SimplifyModifier();
          model.traverse((child) => {
            if (!child.isMesh) return;
            const oldGeo = child.geometry;
            if (!oldGeo?.attributes?.position) return;
            let geo = oldGeo.clone();
            try {
              geo = modifier.modify(geo, collapseN);
              geo.computeVertexNormals();
            } catch (e) {
              console.warn('SimplifyModifier 失败，使用原始网格:', e?.message || e);
              geo = oldGeo.clone();
              geo.computeVertexNormals();
            }
            child.geometry = geo;
            if (oldGeo !== geo) oldGeo.dispose();
          });
        }

        // 预提取 mesh 几何数据
        const meshDataList = [];
        model.traverse((child) => {
          if (!child.isMesh) return;
          child.updateMatrixWorld(true);
          const geo = child.geometry;
          geo.computeBoundingBox();
          meshDataList.push({
            geometry: geo,
            matrixWorld: child.matrixWorld.clone(),
            geoCenter: geo.boundingBox.getCenter(new THREE.Vector3())
          });
        });

        const dist = 5;
        const ambientIntensity = 0.18;

        let allFramesSvg = '';
        let totalFaces = 0;

        for (let frame = 0; frame < FRAME_COUNT; frame++) {
          const azim = (frame / FRAME_COUNT) * Math.PI * 2;

          const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
          camera.position.set(
            dist * Math.cos(CAM_ELEVATION) * Math.sin(azim),
            dist * Math.sin(CAM_ELEVATION),
            dist * Math.cos(CAM_ELEVATION) * Math.cos(azim)
          );
          camera.lookAt(0, 0, 0);
          camera.updateMatrixWorld(true);

          const vpMatrix = new THREE.Matrix4().multiplyMatrices(
            camera.projectionMatrix, camera.matrixWorldInverse
          );

          // 三光源
          const lightDir = new THREE.Vector3(
            Math.sin(azim + 0.5), 2, Math.cos(azim + 0.5)
          ).normalize();
          const fillLightDir = new THREE.Vector3(
            Math.sin(azim + Math.PI), 0.6, Math.cos(azim + Math.PI)
          ).normalize();
          const bottomLightDir = new THREE.Vector3(
            Math.sin(azim + Math.PI * 0.7), -1.5, Math.cos(azim + Math.PI * 0.7)
          ).normalize();

          const faces = [];

          for (const { geometry: geo, matrixWorld, geoCenter } of meshDataList) {
            const mvp = new THREE.Matrix4().multiplyMatrices(vpMatrix, matrixWorld);
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrixWorld);
            const pos = geo.attributes.position;
            const nrm = geo.attributes.normal;
            const idx = geo.index;
            const faceCount = idx ? idx.count / 3 : pos.count / 3;

            for (let f = 0; f < faceCount; f++) {
              const i0 = idx ? idx.getX(f * 3) : f * 3;
              const i1 = idx ? idx.getX(f * 3 + 1) : f * 3 + 1;
              const i2 = idx ? idx.getX(f * 3 + 2) : f * 3 + 2;

              const v0 = proj(pos, i0, mvp, W, H);
              const v1 = proj(pos, i1, mvp, W, H);
              const v2 = proj(pos, i2, mvp, W, H);

              if (v0.z < -1 || v1.z < -1 || v2.z < -1) continue;
              if (v0.z > 1 || v1.z > 1 || v2.z > 1) continue;

              const margin = 20;
              if (v0.x < -margin && v1.x < -margin && v2.x < -margin) continue;
              if (v0.x > W + margin && v1.x > W + margin && v2.x > W + margin) continue;
              if (v0.y < -margin && v1.y < -margin && v2.y < -margin) continue;
              if (v0.y > H + margin && v1.y > H + margin && v2.y > H + margin) continue;

              const area = Math.abs((v1.x - v0.x) * (v2.y - v0.y) - (v1.y - v0.y) * (v2.x - v0.x)) / 2;
              if (area < MIN_FACE_AREA) continue;

              const cross = (v1.x - v0.x) * (v2.y - v0.y) - (v1.y - v0.y) * (v2.x - v0.x);
              if (cross >= 0) continue;

              // 光照计算（屏幕空间背面剔除已由上方 cross<=0 完成，无需额外过滤内壁面）
              if (nrm) {
                const nx = (nrm.getX(i0) + nrm.getX(i1) + nrm.getX(i2)) / 3;
                const ny = (nrm.getY(i0) + nrm.getY(i1) + nrm.getY(i2)) / 3;
                const nz = (nrm.getZ(i0) + nrm.getZ(i1) + nrm.getZ(i2)) / 3;

                // 世界空间法线用于光照计算
                const fn = new THREE.Vector3(nx, ny, nz).applyMatrix3(normalMatrix).normalize();
                const mainDiffuse = Math.max(0, fn.dot(lightDir));
                const fillDiffuse = Math.max(0, fn.dot(fillLightDir));
                const bottomDiffuse = Math.max(0, fn.dot(bottomLightDir));
                let lum = Math.min(1, ambientIntensity + mainDiffuse * 0.50 + fillDiffuse * 0.15 + bottomDiffuse * 0.25);
                lum = Math.pow(lum, 0.85);

                faces.push({ v0, v1, v2, depth: (v0.z + v1.z + v2.z) / 3, lum });
              } else {
                faces.push({ v0, v1, v2, depth: (v0.z + v1.z + v2.z) / 3, lum: ambientIntensity });
              }
            }
          }

          // Painter's algorithm：远 → 近（depth 大的先画）
          faces.sort((a, b) => b.depth - a.depth);
          totalFaces += faces.length;

          // 连续同色面合并为单条 path，灰度改用 #rrggbb
          let paths = '';
          let runFill = null;
          let runD = '';
          const flushRun = () => {
            if (runFill === null) return;
            paths += `<path d="${runD}" fill="${runFill}" stroke="none"/>`;
            runFill = null;
            runD = '';
          };
          for (const f of faces) {
            const g = Math.round(f.lum * 204);
            const fill = grayHex(g);
            const d = `M${ri(f.v0.x)},${ri(f.v0.y)}L${ri(f.v1.x)},${ri(f.v1.y)}L${ri(f.v2.x)},${ri(f.v2.y)}z`;
            if (fill !== runFill) {
              flushRun();
              runFill = fill;
              runD = d;
            } else {
              runD += d;
            }
          }
          flushRun();

          // 帧可见性动画
          const values = Array(FRAME_COUNT).fill('hidden');
          values[frame] = 'visible';
          const keyTimes = Array.from({ length: FRAME_COUNT }, (_, i) =>
            (i / FRAME_COUNT).toFixed(4)
          ).join(';');

          allFramesSvg +=
            `<g visibility="hidden">` +
            `<animate attributeName="visibility" calcMode="discrete" ` +
            `values="${values.join(';')}" keyTimes="${keyTimes}" ` +
            `dur="${animDur}s" repeatCount="indefinite"/>` +
            paths + `</g>`;

          console.log(`帧 ${frame + 1}/${FRAME_COUNT}: ${faces.length} 个可见面`);
        }

        console.log(`全部帧投影完成: ${FRAME_COUNT} 帧, 共 ${totalFaces} 个面`);

        // SVG 滤镜：feMorphology dilate 在模型外边界自动生成黑色轮廓
        const svgString =
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
          `<defs><filter id="outline" x="-5%" y="-5%" width="110%" height="110%">` +
          `<feMorphology in="SourceAlpha" result="dilated" operator="dilate" radius="${OUTLINE_RADIUS}"/>` +
          `<feFlood flood-color="#000" result="color"/>` +
          `<feComposite in="color" in2="dilated" operator="in" result="border"/>` +
          `<feComposite in="SourceGraphic" in2="border" operator="over"/>` +
          `</filter></defs>` +
          `<g id="stone-group" filter="url(#outline)" stroke-width="0.2" stroke-linejoin="round">` +
          allFramesSvg +
          `</g></svg>`;

        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(outputPath, svgString, 'utf-8');

        for (const key of Object.keys(globals)) {
          try { delete globalThis[key]; } catch { }
        }
        resolve();
      } catch (err) { reject(err); }
    }, (err) => reject(new Error(`GLB 模型解析失败: ${err?.message || err}`)));
  });
}

/** 将顶点从模型空间投影到屏幕空间 */
function proj(posAttr, idx, mvpMatrix, w, h) {
  const x = posAttr.getX(idx), y = posAttr.getY(idx), z = posAttr.getZ(idx);
  const e = mvpMatrix.elements;
  const vx = e[0] * x + e[4] * y + e[8] * z + e[12];
  const vy = e[1] * x + e[5] * y + e[9] * z + e[13];
  const vz = e[2] * x + e[6] * y + e[10] * z + e[14];
  const vw = e[3] * x + e[7] * y + e[11] * z + e[15];
  const invW = 1 / vw;
  return {
    x: (vx * invW * 0.5 + 0.5) * w,
    y: (1 - (vy * invW * 0.5 + 0.5)) * h,
    z: vz * invW
  };
}

function ri(v) { return Math.round(v); }

/** 灰度 0–204 → #rrggbb（与旧版 rgb 数值一致，便于 colorizer 算 luminance） */
function grayHex(g) {
  const h = Math.max(0, Math.min(204, g)).toString(16).padStart(2, '0');
  return `#${h}${h}${h}`;
}

// 允许直接运行此脚本生成模板
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outputPath = path.join(__dirname, '..', 'templates', 'stone-template.svg');
  generateTemplate(outputPath, DEFAULT_GENERATE_OPTIONS)
    .then(() => console.log('模板已生成:', outputPath))
    .catch(err => { console.error('错误:', err); process.exit(1); });
}
