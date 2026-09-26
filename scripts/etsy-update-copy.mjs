// One-off copy cleanup for active Etsy listings, recorded for future reference.
// Run only deliberately: node scripts/etsy-update-copy.mjs --apply
import { readEnv, apiHeaders } from './etsy-env.mjs';

if (!process.argv.includes('--apply')) throw new Error('Pass --apply to update the live Etsy listings.');

const updates = {
  4579360791: {
    title: 'Personalised Rose Sculpture Favours | Optional Name Base | Sets of 5–50',
    description: 'A long-stem rose with leaves on a round base. Order a set of 5, 10, 20 or 50 and choose the rose colour. Base text is optional; choose embossed/engraved lettering or a text colour if you add it.\n\nIndividual clear boxes add AU$5 per rose. For boxed orders, choose a gold or silver box base and ribbon colour. Made to order in Sydney.',
  },
  4579376840: {
    title: 'Christ Pantocrator Icon Bonbonniere | Personalised 15cm Baptism Favour, Set of 5',
    description: 'A 15cm Christ Pantocrator icon made as a baptism or christening favour. Sold in sets of five: AU$100 unboxed or AU$150 boxed.\n\nChoose the icon colour and add base text if you wish. Text can be embossed/engraved or printed in a chosen colour. Boxed pieces come in individual clear boxes with a gold or silver base; choose a ribbon colour. Made to order in Sydney.',
  },
  4579373618: {
    title: 'Personalised First Tooth Favour Tags | Snoubar Name Tags, Sets of 5–50',
    description: 'A tooth-shaped tag to tie to a jar, favour box or snoubar bag for a first tooth celebration. Choose the base and trim colours, and add a name if you wish. Sold in sets of 5, 10, 20 or 50. Made to order in Sydney.',
  },
  4579363684: {
    title: 'Saint Arnold Janssen Statue | Catholic SVD Divine Word Gift, 15–30cm',
    description: 'Saint Arnold Janssen, founder of the Society of the Divine Word, stands in his habit with hands folded. The base can carry a name, year or dedication. Choose one of fourteen finishes and a 15cm, 20cm, 25cm or 30cm size. Made to order in Sydney.',
  },
  4579346739: {
    title: 'Saint Anthony of Padua Statue with Child Jesus | Personalised Base, 15–30cm',
    description: 'Saint Anthony of Padua holds the child Jesus, with a lily and rosary. Add a name, year or dedication to the base if you wish. Choose one of fourteen finishes and a 15cm, 20cm, 25cm or 30cm size. Made to order in Sydney.',
  },
  4579361528: {
    title: 'Personalised Christmas Tree Place Setting | Name Star Topper',
    description: 'A tiered Christmas tree with a star topper that can carry a name. The tiers twist apart. Choose Silk White, Mint Green or Silk Gold. Text is optional; choose embossed/engraved lettering or a text colour if you add it. Made to order in Sydney.',
  },
  4579344605: {
    title: 'Orthodox Cross Car Hanger | Budded Rear-View Mirror Charm',
    description: 'A two-tone budded Orthodox cross on a black cord, made to hang from a rear-view mirror. 3D printed and made to order in Sydney.',
  },
  1891536208: {
    title: 'Saint Peter Statue with Keys | Catholic Figure, 15–30cm',
    description: 'Saint Peter stands holding the keys of heaven. Choose one of fourteen finishes and a 15cm, 20cm, 25cm or 30cm size. 3D printed and made to order in Sydney.',
  },
  1901591525: {
    title: 'Immaculate Mary Statue | Our Lady over the Serpent, 15–30cm',
    description: 'The Virgin Mary stands over the serpent with hands open in this Immaculate Conception statue. Choose one of fourteen finishes and a 15cm, 20cm, 25cm or 30cm size. 3D printed and made to order in Sydney.',
  },
  1887372006: {
    title: 'Saint Dominic de Guzmán Statue | Dominican Catholic Figure, 15–30cm',
    description: 'Saint Dominic de Guzmán, founder of the Dominican Order, is shown in his friar’s habit. Add a name, year or dedication to the base if you wish. Choose one of fourteen finishes and a 15cm, 20cm, 25cm or 30cm size. Made to order in Sydney.',
  },
  1893943073: {
    title: 'Saint Charbel Statue | Maronite Catholic Figure, 15–30cm',
    description: 'Saint Charbel stands in prayer with hands clasped and head bowed, wearing his Maronite habit. Choose one of fourteen finishes and a 15cm, 20cm, 25cm or 30cm size. 3D printed and made to order in Sydney.',
  },
  1879775206: {
    title: 'Saint George and Dragon Icon | Arched Orthodox Relief, 15–25cm',
    description: 'Saint George rides with his spear lowered toward the dragon in this arched relief icon. Choose one of twelve finishes and a 15cm, 20cm or 25cm size. 3D printed and made to order in Sydney.',
  },
  1893943095: {
    title: 'Sacred Heart of Jesus Statue | Catholic Figure, 15–30cm',
    description: 'The Sacred Heart of Jesus stands with arms open and the heart shown at the centre of the robe. Choose one of fourteen finishes and a 15cm, 20cm, 25cm or 30cm size. 3D printed and made to order in Sydney.',
  },
  1879771208: {
    title: 'Virgin Mary and Child Jesus Icon | Arched Theotokos Relief, 15–25cm',
    description: 'The Virgin Mary holds the infant Jesus in an arched relief icon. Choose one of twelve finishes and a 15cm, 20cm or 25cm size. Made to order in Sydney; it shares its arch and sizes with the Christ Pantocrator icon.',
  },
  1879769792: {
    title: 'Saint Nicholas the Wonderworker Icon | Orthodox Relief, 15–25cm',
    description: 'Saint Nicholas the Wonderworker is shown in blessing, vested as a bishop, in an arched relief icon. Choose one of twelve finishes and a 15cm, 20cm or 25cm size. 3D printed and made to order in Sydney.',
  },
  1893949429: {
    title: 'Saint Michael the Archangel Icon | Arched Relief, 15–25cm',
    description: 'Saint Michael the Archangel shown as protector in an arched relief icon. Choose one of twelve finishes and a 15cm, 20cm or 25cm size. 3D printed and made to order in Sydney.',
  },
  4311901365: {
    title: 'Personalised Christening Coasters, 10cm | Baptism Favour with Name & Date | Sets of 5–20',
    description: 'A 10cm white christening coaster with a cross and dove. Add a name and date, choose a trim colour, and order a set of 5, 10, 15 or 20.\n\nChoose No box or add an individual clear box for AU$5 per coaster. For boxed orders, select a gold or silver box base and ribbon colour.\n\nMade to order in Sydney.',
    tags: ['christening favour', 'baptism coaster', 'baptism favour', 'christening coaster', 'personalised coaster', 'coaster bonbonniere', 'name date coaster', 'cross dove coaster', 'boxed baptism favour', 'baptism keepsake', 'custom name coaster', 'christening gift', 'baby naming favour'],
  },
  4579357288: {
    title: 'Saint Joseph and Child Jesus Icon | Arched Catholic Relief, 15–25cm',
    description: 'Saint Joseph holds the child Jesus and a lily in this arched relief icon. Choose a colour and a 15cm, 20cm or 25cm size. Made to order in Sydney for a prayer shelf, a baptism or a name day gift.',
    tags: ['Saint Joseph Icon', 'St Joseph Icon', 'Saint Joseph Gift', 'Joseph Child Jesus', 'Joseph and Jesus', 'Catholic Icon', 'Catholic Gift', 'Baptism Gift', 'Christening Gift', '3D Catholic Icon', 'Arched Wall Icon', 'Holy Family Icon', 'St Joseph Baptism'],
  },
  4579336997: {
    title: 'Saint Paisios of Mount Athos Icon | Arched Orthodox Relief, 15–25cm',
    description: 'An arched relief icon of Saint Paisios of Mount Athos in his monastic habit, with Orthodox knotwork around the border. Choose a colour and a 15cm, 20cm or 25cm size. Made to order in Sydney.',
  },
  1879773522: {
    title: 'Christ Pantocrator Icon | Jesus Holding Book, 15–25cm',
    description: 'Christ Pantocrator shown in blessing with a book in hand, set in an arched relief frame. Choose a colour and a 15cm, 20cm or 25cm size. Made to order in Sydney for a prayer shelf or a baptism gift.',
    tags: ['Pantocrator Icon', 'Christ Pantocrator', 'Jesus Christ Icon', 'Orthodox Icon', 'Byzantine Icon', 'Christ the Teacher', 'Icon of the Redeemer', 'Greek Orthodox Icon', '3D Jesus Icon', 'Jesus Holding Book', 'Orthodox Wall Icon', 'Prayer Corner Icon', 'Christ Blessing Icon'],
  },
  1760361490: {
    title: 'Saint Michael the Archangel Statue | Defeating the Devil | 3D Printed Catholic Figure',
    description: 'Saint Michael in armour with raised wings, standing over the defeated devil. Choose a colour and a 15cm, 20cm, 25cm or 30cm size. 3D printed in PLA and made to order in Sydney.',
    tags: ['Saint Michael', 'Saint Michael Statue', 'Archangel Michael', 'St Michael Statue', 'Saint Michael Art', 'Michael Archangel', 'Baptism Gift', 'Catholic Statue', 'Christian Statue', 'Religious Statue', 'Confirmation Gift', 'Home Altar Statue', 'archangel statue'],
  },
  4432941364: {
    title: 'Saint Charbel Under a Tree Statue | Maronite Catholic Figure with Open Book',
    description: 'Saint Charbel sits beneath a tree with an open book. Choose a colour and a 15cm, 20cm, 25cm or 30cm size. 3D printed in PLA and made to order in Sydney.',
    tags: ['Saint Charbel', 'Saint Charbel Statue', 'St Charbel Statue', 'St Charbel Sitting', 'Saint Charbel Tree', 'St Charbel Tree', 'Saint Charbel Art', 'St Charbel Lebanon', 'Maronite Saint', 'St Charbel Gift', 'Charbel Tree Statue', 'Catholic Statue', 'Maronite Gift'],
  },
  4544225986: {
    title: 'Saint Michael Icon Bonbonniere | Personalised 15cm Baptism Favour | Boxed or Unboxed Set of 5',
    description: 'A 15cm Saint Michael icon made as a wedding, baptism or christening favour. Sold in sets of five: AU$100 unboxed or AU$150 boxed.\n\nChoose the icon colour and add up to 16 characters of base text if you wish. Text can be embossed/engraved or printed in a chosen colour. Boxed pieces come in individual clear boxes with a gold or silver base; choose a ribbon colour. Made to order in Sydney.',
    tags: ['st michael icon', 'saint michael icon', 'archangel michael', 'michael icon favour', 'baptism bonbonniere', 'christening favour', 'wedding bonbonniere', 'orthodox bonbonniere', 'personalised icon', 'boxed baptism favour', 'st michael baptism', 'custom name icon', 'religious wedding'],
  },
  4579364231: {
    title: 'Saint Elias Icon Bonbonniere | Personalised 15cm Baptism Favour, Set of 5',
    description: 'A 15cm Saint Elias icon made as a baptism, christening or name day favour. Sold in sets of five: AU$100 unboxed or AU$150 boxed.\n\nChoose the icon colour and add base text if you wish. Text can be embossed/engraved or printed in a chosen colour. Boxed pieces come in individual clear boxes with a gold or silver base; choose a ribbon colour. Made to order in Sydney.',
    tags: ['Saint Elias', 'St Elias Icon', 'Mar Elias', 'Saint Elias Icon', 'Elias Prophet', 'Baptism Bonbonniere', 'Christening Favour', 'Personalised Icon', 'Baptism Favour', 'Maronite Gift', 'Custom Name Icon', 'Saint Elias Favour', 'Mar Elias Baptism'],
  },
};

for (const [id, update] of Object.entries(updates)) {
  if (update.title?.length > 140) throw new Error(`${id}: title too long`);
  if (update.tags && (update.tags.length > 13 || update.tags.some(tag => tag.length > 20))) throw new Error(`${id}: invalid tags`);
}

const env = readEnv();
const headers = apiHeaders(env);
const api = 'https://api.etsy.com/v3/application';
for (const [id, update] of Object.entries(updates)) {
  if (process.argv.includes('--titles-only') && !update.title) continue;
  const fields = process.argv.includes('--titles-only') ? { title: update.title } : update;
  const body = new URLSearchParams();
  if (fields.title) body.set('title', fields.title);
  if (fields.description) body.set('description', fields.description);
  if (fields.tags) body.set('tags', fields.tags.join(','));
  const response = await fetch(`${api}/shops/${env.ETSY_SHOP_ID}/listings/${id}`, {
    method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' }, body,
  });
  const listing = await response.json();
  if (!response.ok) throw new Error(`${id}: ${response.status} ${JSON.stringify(listing).slice(0, 350)}`);
  if (fields.title && listing.title !== fields.title) throw new Error(`${id}: title did not save`);
  if (fields.description && listing.description !== fields.description) throw new Error(`${id}: description did not save`);
  if (fields.tags && (listing.tags.length !== fields.tags.length || fields.tags.some(tag => !listing.tags.includes(tag)))) throw new Error(`${id}: tags did not save`);
  console.log(`${id}: title ${Boolean(fields.title)}, description ${Boolean(fields.description)}, tags ${Boolean(fields.tags)} verified`);
}
