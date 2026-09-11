import sharp from 'sharp';

// Keep the supplied PNG as the source; send appropriately sized WebP to visitors.
for (const width of [400, 600, 800, 1200]) {
  const target = `public/work/isculptures-logo-${width}.webp`;
  const result = await sharp('assets/brand/isculptures-logo-dark-left.png')
    .resize({ width }).webp({ quality: width === 600 ? 78 : 85, effort: 6 }).toFile(target);
  console.log(`${target}: ${result.width} x ${result.height}, ${result.size} bytes`);
}
