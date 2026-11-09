// 生成分享卡片 public/og-image.png（1200x630）
//
// 新版无头 Chrome 的截图高度等于窗口高度，而布局视口比窗口矮几十像素，
// 想让卡片完整绘制就得给足窗口高度，再把多出来的行裁掉。
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const WIDTH = 1200;
const HEIGHT = 630;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'scripts', 'og-card.html');
const target = path.join(root, 'public', 'og-image.png');
const raw = path.join(root, 'node_modules', '.cache-og-shot.png');

const chrome = process.env.CHROME_BIN || 'google-chrome';
const shot = spawnSync(
  chrome,
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    '--allow-file-access-from-files',
    '--force-device-scale-factor=1',
    `--window-size=${WIDTH},${HEIGHT + 180}`,
    '--virtual-time-budget=6000',
    `--screenshot=${raw}`,
    source,
  ],
  { stdio: 'ignore' }
);

if (shot.error || !fs.existsSync(raw)) {
  console.error(`截图失败，确认 ${chrome} 可用（可用 CHROME_BIN 指定路径）`);
  process.exit(1);
}

const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

function cropToHeight(buffer, height) {
  const chunks = [];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    chunks.push({ type, data: buffer.subarray(offset + 8, offset + 8 + length) });
    offset += length + 12;
  }

  const ihdr = chunks.find((chunk) => chunk.type === 'IHDR');
  const width = ihdr.data.readUInt32BE(0);
  const bitDepth = ihdr.data[8];
  const colorType = ihdr.data[9];
  const interlaced = ihdr.data[12];
  if (bitDepth !== 8 || interlaced !== 0 || !CHANNELS[colorType]) {
    throw new Error(`unsupported png: depth=${bitDepth} color=${colorType} interlace=${interlaced}`);
  }

  const pixels = zlib.inflateSync(
    Buffer.concat(chunks.filter((chunk) => chunk.type === 'IDAT').map((chunk) => chunk.data))
  );
  // 每行是 1 字节过滤器 + 像素数据，过滤器只回看上一行，所以留前 N 行即可
  const stride = 1 + width * CHANNELS[colorType];
  if (pixels.length < stride * height) {
    throw new Error(`screenshot is only ${pixels.length / stride} rows tall, need ${height}`);
  }

  ihdr.data.writeUInt32BE(height, 4);
  const idat = zlib.deflateSync(pixels.subarray(0, stride * height), { level: 9 });

  const out = [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])];
  let idatWritten = false;
  for (const chunk of chunks) {
    if (chunk.type === 'IDAT') {
      if (idatWritten) continue;
      idatWritten = true;
      out.push(encodeChunk('IDAT', idat));
      continue;
    }
    out.push(encodeChunk(chunk.type, chunk.data));
  }
  return Buffer.concat(out);
}

function encodeChunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

fs.writeFileSync(target, cropToHeight(fs.readFileSync(raw), HEIGHT));
fs.rmSync(raw, { force: true });
console.log(
  `og-image.png ${WIDTH}x${HEIGHT} (${Math.round(fs.statSync(target).size / 1024)} KB)`
);
