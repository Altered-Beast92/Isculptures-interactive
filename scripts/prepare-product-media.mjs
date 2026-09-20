// Downloads the studio's own Etsy listing photographs and converts them for the site.
// Etsy blocks scripted requests to listing pages, but not to its image CDN, so the URLs
// below were collected from the rendered pages and are recorded here for provenance.
// Re-run after adding a URL; existing files are overwritten in place.
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const sources = {
  'saint-charbel-statue': ['Saint Charbel “Revered” statue in white, standing with hands clasped', [
    '840503/6832152845/il_794xN.6832152845_5rdm', 'c44d6a/6783047012/il_794xN.6783047012_n1ew']],
  'jesus-christ-sacred-heart': ['Jesus Christ “Sacred Heart” statue with arms outstretched', [
    'bc612d/6784158058/il_794xN.6784158058_jfkt', '2f2672/6783050276/il_794xN.6783050276_eh8k']],
  'saint-charbel': ['Saint Charbel seated under a tree, reading an open book', [
    '63d373/7552071588/il_794xN.7552071588_9neg', '57add5/7551991958/il_794xN.7551991958_sfj5']],
  'saint-michael-statue': ['Saint Michael the Archangel statue defeating the devil', [
    '3f2932/6430010065/il_794xN.6430010065_3mr3']],
  'saint-michael-the-archangel-defender-of-faith-icon': ['Arched icon of Saint Michael the Archangel', [
    '7b2d33/6793632665/il_794xN.6793632665_62pn']],
  'saint-george-the-victorious': ['Arched icon of Saint George on horseback defeating the dragon', [
    '57f117/6745672068/il_794xN.6745672068_oezm']],
  'divine-jesus-christ-icon': ['Arched icon of Jesus Christ holding a book', [
    '3302a5/6745659818/il_794xN.6745659818_poyr']],
  'virgin-mary-and-jesus-icon': ['Arched icon of the Virgin Mary holding the infant Jesus', [
    '64d5df/6793678775/il_794xN.6793678775_6okz']],
  'saint-nicholas-the-wonderworker': ['Arched icon of Saint Nicholas the Wonderworker in gold', [
    '1207f1/6793670009/il_794xN.6793670009_suxs']],
  'st-michael-icon-bonbonniere': ['Boxed Saint Michael icon favours finished with ribbon', [
    '840503/8298859290/il_794xN.8298859290_eyok', 'fee7ec/8298857128/il_794xN.8298857128_ezb0']],
  'christening-coaster-bonbonniere': ['Personalised white christening coaster with a cross and dove', [
    '1eb3df/6943184013/il_794xN.6943184013_iqcx', '55be3f/6895199414/il_794xN.6895199414_oq2r']],
};

// il_794xN is what the page renders; il_fullxfull is the original upload.
const url = part => `https://i.etsystatic.com/53457944/r/il/${part.replace('il_794xN', 'il_fullxfull')}.jpg`;

await mkdir('public/products', { recursive: true });
const media = {};
for (const [slug, [alt, parts]] of Object.entries(sources)) {
  const images = [];
  for (const [index, part] of parts.entries()) {
    const response = await fetch(url(part));
    if (!response.ok) throw new Error(`${slug} image ${index + 1}: Etsy returned ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const name = index ? `${slug}-${index + 1}` : slug;
    const pipeline = () => sharp(buffer).rotate();
    const full = await pipeline().resize({ width: 1200, height: 1500, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(`public/products/${name}.webp`);
    const small = await pipeline().resize({ width: 640, height: 800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(`public/products/${name}-small.webp`);
    images.push({ src: `/products/${name}.webp`, alt, width: full.width, height: full.height, smallWidth: small.width });
  }
  media[slug] = images;
  console.log(slug.padEnd(52), images.map(i => `${i.width}x${i.height}`).join(' '));
}
await writeFile('content/product-media.json', JSON.stringify(media, null, 2) + '\n');
console.log('\nWrote content/product-media.json');
