// Prepare the fixed base's soft footprint; no WebGL work is needed at runtime.
// Keep these dimensions aligned with the base and shadow plane in printer-scene.
import sharp from 'sharp';
const resolution = 256, plane = 7, width = 3.55, depth = 2.7;
const w = width / plane * resolution, h = depth / plane * resolution;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${resolution}" height="${resolution}"><defs><filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.5"/></filter></defs><rect x="${(resolution-w)/2}" y="${(resolution-h)/2}" width="${w}" height="${h}" fill="black" opacity=".98" filter="url(#soft)"/></svg>`;
const result = await sharp(Buffer.from(svg)).png().toFile('public/models/printer-ground-shadow.png');
console.log(`Baked ${result.width} x ${result.height} base shadow: ${result.size} bytes`);
