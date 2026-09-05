import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const source = process.argv[2];
if (!source) throw new Error('Pass the supplied media directory.');
const assets = [
  ['event-favours', 'SaintEliasBonbonnierre.jpg', 'A batch of white sculptural favours in clear boxes with pale green ribbon'],
  ['event-display', 'Bonbonniere_Event_Favours.jpg', 'Boxed sculptural favours arranged together on an event table'],
  ['favour-detail', 'SaintEliasBonbonnierre.png', 'Detail of sculptural favours and matching pale green bows'],
  ['boxed-keepsakes', 'Saint_Peter_Bonbonniere.jpg', 'White sculptural keepsakes in clear gold-edged presentation boxes'],
  ['personalised-batch', 'IMG_2395.jpg', 'A group of clear favour boxes with white bows and personalised gold tags'],
  ['ribbon-tag', 'IMG_2385.jpg', 'A personalised gold tag tied to a clear favour box with a white bow'],
  ['commemorative-icons', 'Orthodox_Icon_Bonbonniere_Virgin_Mary_Christ.png', 'Two arched religious icons with personalised commemorative bases'],
  ['gift-boxes', 'Personalised_Valentine_s_Day_Chocolate_Gift_Box_with_Custom_Message.jpg', 'Pink and red heart-shaped gift boxes with ribbons and message plaques'],
  ['pink-gift-box', 'Pink_Valentine_s_Chocolate_Gift_Box_with_Black_Ribbon_and_Customisable_Plaque.jpg', 'Pink heart-shaped gift box with a black ribbon and personalised message plaque'],
  ['red-gift-box', 'Red_Valentine_s_Chocolate_Gift_Box_with_White_Ribbon_and_Customisable_Plaque.jpg', 'Red heart-shaped gift box with a white ribbon and message plaque'],
];
await mkdir('public/work', { recursive: true });
const media = {};
const manifest = [];
for (const [id, filename, alt] of assets) {
  const file = path.join(source, filename);
  const output = `public/work/${id}.webp`;
  const info = await sharp(file).rotate().resize({ width: 1200, height: 1500, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(output);
  const small = await sharp(file).rotate().resize({ width: 640, height: 800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(`public/work/${id}-small.webp`);
  media[id] = { src: `/work/${id}.webp`, alt, width: info.width, height: info.height, smallWidth: small.width };
  manifest.push({ source: filename, output, bytes: info.size });
}
await writeFile('content/work-media.json', JSON.stringify(media, null, 2) + '\n');
await writeFile('docs/media-manifest.json', JSON.stringify({ provenance: 'User-supplied media folder, 6 September 2026. Originals retained. Resized and compressed; no generated artwork or invented production claims.', assets: manifest }, null, 2) + '\n');
console.log(`Prepared ${assets.length} photographs and responsive variants.`);
