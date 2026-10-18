import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import gifenc from 'gifenc';

const { GIFEncoder, applyPalette } = gifenc;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const colors = {
  ink: '#191919', paper: '#fffdf5', yellow: '#ffde59',
  purple: '#c9b6ff', mint: '#b9e6ce', coral: '#ff8c69',
};
const fps = 25;
const seconds = 4.4;
const frameCount = Math.round(fps * seconds);
const preview = process.argv.includes('--preview');
const clamp = (value) => Math.max(0, Math.min(1, value));
const progress = (time, start, duration) => clamp((time - start) / duration);
const ease = (p) => 1 - (1 - p) ** 3;
const settle = (p) => p === 0 || p === 1 ? p : 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2;
const number = (value) => Number(value.toFixed(3));
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function text(x, y, size, value, fill = colors.ink, mono = false, extra = '') {
  const family = mono ? 'Courier New, Liberation Mono, monospace' : 'Arial, Liberation Sans, sans-serif';
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="${family}" font-size="${size}" font-weight="${mono ? 700 : 900}" ${extra}>${escape(value)}</text>`;
}

function rect(x, y, width, height, fill, stroke = colors.ink, line = 3) {
  return `<rect x="${number(x)}" y="${number(y)}" width="${number(Math.max(0, width))}" height="${number(Math.max(0, height))}" fill="${fill}" stroke="${stroke}" stroke-width="${line}"/>`;
}

function star(x, y, radius, fill, rotation = 0, scale = 1) {
  const points = Array.from({ length: 8 }, (_, i) => {
    const angle = i * Math.PI / 4 - Math.PI / 2;
    const length = i % 2 ? radius * 0.26 : radius;
    return `${number(Math.cos(angle) * length)},${number(Math.sin(angle) * length)}`;
  }).join(' ');
  return `<g transform="translate(${x} ${y}) rotate(${number(rotation)}) scale(${number(scale)})"><polygon points="${points}" fill="${fill}" stroke="${colors.ink}" stroke-width="3"/></g>`;
}

async function loadPoster(mobile) {
  const name = `hackpack-hero${mobile ? '-mobile' : ''}.svg`;
  const source = await readFile(resolve(root, 'assets', name), 'utf8');
  const body = source.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
    .replace(/<(title|desc)\b[^>]*>[\s\S]*?<\/\1>/g, '').trim();
  // These posters use flat shapes and single-level groups. Fail explicitly if
  // their structure changes rather than silently dropping artwork on rebuild.
  const nodes = body.match(/<g\b[\s\S]*?<\/g>|<text\b[^>]*>[\s\S]*?<\/text>|<(?:rect|path|circle)\b[^>]*\/>/g) ?? [];
  if (nodes.join('').replace(/\s/g, '') !== body.replace(/\s/g, '')) {
    throw new Error(`Unsupported SVG structure in ${name}; update the layer parser.`);
  }
  return { mobile, width: mobile ? 640 : 1200, height: mobile ? 780 : 586, nodes };
}

function intro({ mobile, width }, time) {
  const p = ease(progress(time, 0, 0.5));
  const typed = "> let's make something.";
  const command = typed.slice(0, Math.round(typed.length * progress(time, 0.12, 0.9)));
  const cursor = time < 1.15 ? '_' : '';
  const turn = Math.sin(time * 2.5) * 7;
  if (mobile) {
    return `<g>
      ${text(40, 116, 18, 'A LITTLE CURIOSITY. A LOT OF POSSIBILITY.', colors.ink, true)}
      ${text(31, 236, 87, 'HACKPACK', colors.ink, false, 'letter-spacing="-5"')}
      ${text(31, 338, 110, 'CLUB.', colors.ink, false, 'letter-spacing="-5"')}
      ${star(530, 300, 39, colors.coral, turn)}
      <g transform="translate(0 ${number(16 * (1 - p))})">
        ${rect(46, 401, 528, 230, colors.ink)}
        ${rect(38, 393, 528, 230, colors.purple)}
        ${rect(38, 393, 528, 42, colors.yellow)}
        ${text(58, 421, 18, '● ● ●', colors.ink, true)}
        ${text(373, 421, 17, 'hello-pack.sh', colors.ink, true)}
        ${text(62, 482, 21, '$ curiosity --unlimited', colors.ink, true)}
        ${text(62, 523, 19, command + cursor, colors.ink, true)}
        ${rect(62, 561, 478, 24, colors.paper, colors.ink, 2)}
        ${rect(67, 566, 468 * progress(time, 0.1, 1.15), 14, colors.mint, 'none', 0)}
      </g>
      ${text(40, 704, 22, 'GOOD CODE. BETTER COMPANY.', colors.ink, true)}
      ${text(40, 737, 17, 'YOUR NEXT COMMIT STARTS HERE ↗', colors.ink, true)}
    </g>`;
  }
  return `<g>
    <g transform="translate(230 294) rotate(${number(-8 + turn)})">
      ${rect(-107, -107, 230, 230, colors.ink)}
      ${rect(-119, -119, 230, 230, colors.purple)}
      ${text(-94, 36, 104, '</>', colors.ink, true)}
    </g>
    ${star(340, 165, 37, colors.mint, turn * 2)}
    ${star(103, 416, 24, colors.coral, -turn * 3)}
    ${text(435, 191, 18, 'ONE PACK. INFINITE POSSIBILITIES.', colors.ink, true)}
    ${text(428, 269, 65, 'HACKPACK CLUB', colors.ink, false, 'letter-spacing="-3"')}
    ${text(435, 310, 22, 'Curiosity detected. Bringing people together.', colors.ink, true)}
    ${rect(443, 342, 674, 79, colors.ink)}
    ${rect(435, 334, 674, 79, colors.purple)}
    ${text(457, 384, 29, command + cursor, colors.ink, true)}
    ${rect(435, 447, 674, 14, colors.paper, colors.ink, 2)}
    ${rect(439, 451, 666 * progress(time, 0.1, 1.15), 6, colors.mint, 'none', 0)}
    ${text(47, 530, 19, 'GOOD CODE. BETTER COMPANY.', colors.ink, true)}
    ${text(width - 301, 530, 18, 'INITIALIZING THE PACK ↗', colors.ink, true)}
  </g>`;
}

function typeCode(node, time) {
  let row = 0;
  return node.replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/g, (whole, attrs, value) => {
    // Line numbers and the filename stay still; only the code gets typed.
    if (!value.includes('const pack') && !value.includes('curiosity:') &&
        !value.includes('ideas:') && value !== '};' && !value.includes('let\'s make')) return whole;
    const p = progress(time, 2.48 + row++ * 0.11, 0.27);
    if (p === 1) return whole;
    const plain = value.replaceAll('&gt;', '>');
    return `<text${attrs}>${escape(plain.slice(0, Math.floor(plain.length * p)))}</text>`;
  });
}

function assembled(poster, time) {
  const { nodes, mobile } = poster;
  let smallText = 0;
  return nodes.slice(3).map((node) => {
    if (node.includes('H / P') || node.includes('EST. 2026') || (!mobile && node.includes('A STUDENT CODING COMMUNITY'))) {
      return '';
    }
    let start = 2.65;
    let duration = 0.5;
    let dy = 28;
    let dx = 0;
    let scale = false;
    let center = mobile ? [310, 550] : [950, 290];
    let angle = 0;
    if (node.includes('>HACKPACK<')) {
      start = 1.57; duration = 0.72; dy = 110; dx = -24;
    } else if (node.includes('>CLUB<') || node.includes('>CLUB.<')) {
      start = 1.76; duration = 0.66; dy = 115; dx = -24;
    } else if (node.includes('pack.js')) {
      start = 2.13; duration = 0.76; dx = mobile ? 0 : 255; dy = mobile ? 190 : 90;
      angle = 9;
      node = typeCode(node, time);
    } else if (node.includes('IDEAS WELCOME')) {
      start = 3.03; duration = 0.42; scale = true; center = [1047, 105]; angle = -15;
    } else if (node.includes('BUILD. BREAK. REPEAT.')) {
      start = 3.19; duration = 0.42; scale = true; center = [849, 470]; angle = 12;
    } else if (node.startsWith('<path')) {
      start = 2.87; duration = 0.57; scale = true;
      center = mobile ? [536, 321] : node.includes('M707') ? [707, 112] : [1121, 469];
      angle = 65;
    } else if (node.includes('>#') || node.includes('>.</text>')) {
      start = 2.63; duration = 0.38; scale = true; center = [453, 318];
    } else {
      start = 2.56 + Math.min(smallText++, 6) * 0.055;
    }
    const p = progress(time, start, duration);
    if (p === 0) return '';
    if (p === 1) return node;
    const e = settle(p);
    const alpha = Math.min(1, p * 5);
    const transform = scale
      ? `translate(${center.join(' ')}) rotate(${number(angle * (1 - e))}) scale(${number(e)}) translate(${-center[0]} ${-center[1]})`
      : `translate(${number(dx * (1 - e))} ${number(dy * (1 - e))}) rotate(${number(angle * (1 - e))} ${center.join(' ')})`;
    return `<g opacity="${number(alpha)}" transform="${transform}">${node}</g>`;
  }).join('');
}

function sweep(poster, time) {
  const { width, height, mobile } = poster;
  const p = progress(time, 1.12, 0.9);
  if (p === 0 || p === 1) return '';
  const middle = (height + 60) / 2;
  const panelWidth = width + height * 0.23 + 40;
  const enter = ease(progress(time, 1.12, 0.25));
  const leave = ease(progress(time, 1.62, 0.4));
  const slide = -panelWidth * (1 - enter) + (width + 130) * leave;
  const lowerSlide = width * (1 - enter) - panelWidth * leave;
  const topBaseline = middle - 32;
  const bottomBaseline = middle + (mobile ? 130 : 140);
  return `<g clip-path="url(#inside)">
    <g transform="translate(${number(slide)} 0) skewX(-12)">
      ${rect(0, 60, panelWidth, middle - 60, colors.yellow, colors.ink, 4)}
      ${text(number(width / 2 + topBaseline * 0.213), topBaseline, mobile ? 92 : 140, 'CODE.', colors.ink, false, 'letter-spacing="-6" text-anchor="middle"')}
    </g>
    <g transform="translate(${number(lowerSlide)} 0) skewX(-12)">
      ${rect(0, middle, panelWidth, height - middle, colors.purple, colors.ink, 4)}
      ${text(number(width / 2 + bottomBaseline * 0.213), bottomBaseline, mobile ? 77 : 122, 'TOGETHER.', colors.ink, false, 'letter-spacing="-5" text-anchor="middle"')}
    </g>
  </g>`;
}

function frame(poster, time) {
  const { width, height, nodes } = poster;
  if (time >= 3.9) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${nodes.join('')}</svg>`;
  }
  const shell = nodes.slice(0, 3).join('');
  const masthead = nodes.slice(3).filter((node) => node.includes('H / P') || node.includes('EST. 2026') ||
    (!poster.mobile && node.includes('A STUDENT CODING COMMUNITY'))).join('');
  const contents = time < 1.6 ? intro(poster, time) : assembled(poster, time);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><clipPath id="inside"><rect x="3" y="61" width="${poster.mobile ? 614 : 1178}" height="${poster.mobile ? 697 : 505}"/></clipPath></defs>
    ${shell}<g clip-path="url(#inside)">${contents}</g>${masthead}${sweep(poster, time)}
  </svg>`;
}

function makePalette() {
  const base = Object.values(colors).map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)));
  const palette = [...base];
  // Shared palette keeps anti-aliased edges steady between frames. Every edge
  // is a blend of two brand colors, so no per-frame quantization is needed.
  for (let a = 0; a < base.length; a++) {
    for (let b = a + 1; b < base.length; b++) {
      for (let step = 1; step < 7; step++) {
        palette.push(base[a].map((c, i) => Math.round(c + (base[b][i] - c) * step / 7)));
      }
    }
  }
  return palette;
}

const opaquePalette = makePalette();
const palette = [[255, 0, 255], ...opaquePalette];
const fontDirs = process.env.HACKPACK_FONT_DIR ? [process.env.HACKPACK_FONT_DIR] : [];
const render = (svg) => new Resvg(svg, {
  background: colors.paper,
  font: { loadSystemFonts: true, fontDirs, defaultFontFamily: 'Arial', sansSerifFamily: 'Arial', monospaceFamily: 'Courier New' },
}).render();

for (const mobile of [false, true]) {
  const poster = await loadPoster(mobile);
  const { width, height } = poster;
  const suffix = mobile ? '-mobile' : '';
  const gif = GIFEncoder();
  let previous;
  for (let i = 0; i <= frameCount; i++) {
    const time = i / fps;
    const rendered = render(frame(poster, time));
    const indexed = applyPalette(rendered.pixels, opaquePalette);
    for (let j = 0; j < indexed.length; j++) indexed[j]++;
    const delta = indexed.slice();
    if (previous) {
      for (let j = 0; j < delta.length; j++) {
        if (indexed[j] === previous[j]) delta[j] = 0;
      }
    }
    gif.writeFrame(delta, width, height, {
      ...(i === 0 ? { palette } : {}),
      delay: i === frameCount ? 1000 : 1000 / fps,
      repeat: -1, transparent: i !== 0, transparentIndex: 0, dispose: 1,
    });
    previous = indexed;
  }
  gif.finish();
  const path = resolve(root, 'assets', `hackpack-opening${suffix}.gif`);
  await writeFile(path, gif.bytes());
  console.log(`${path}: ${(gif.bytesView().length / 1024).toFixed(0)} KB, ${width}×${height}, plays once`);
  if (preview) {
    const output = resolve(root, '.opening-preview');
    await mkdir(output, { recursive: true });
    for (const time of [0, 0.8, 1.44, 1.92, 2.4, 3, 3.5, 4.4]) {
      await writeFile(resolve(output, `frame${suffix}-${time}.png`), render(frame(poster, time)).asPng());
    }
  }
}
