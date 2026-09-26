// The studio's Etsy catalogue, mirrored onto its own domain.
//
// Every slug here matches a Shopify product URL that previously redirected to Etsy, so
// those URLs become real pages again rather than sending their ranking to a marketplace.
// Bonbonniere entries are the studio's core bulk business.
//
// Prices are the Australian ones shown on the listing, in AUD, and are the figures the
// schema publishes. Check them against Etsy when the shop's pricing changes.
export type ProductSize = { label: string; price: number };

export type Product = {
  slug: string;
  title: string;
  /** Short line for cards and the meta description. */
  summary: string;
  /** Body copy, written for the site rather than lifted from the listing. */
  intro: string;
  listingId: string;
  sizes: ProductSize[];
  /** Only for a listing with regional pricing: the base ladder the Etsy API reports,
   *  which is what buyers outside Australia pay. `sizes` above stays the Australian
   *  price this site publishes; this field exists so scripts/etsy-sync.mjs still has
   *  something real to check the listing against instead of reporting false drift. */
  etsyBaseSizes?: ProductSize[];
  colours: string[];
  /** Ribbon or finish choices offered alongside colour, where the listing has them. */
  finishes?: string[];
  /** Ids from content/testimonials.ts that name this piece. */
  reviews?: string[];
  /** Which enquiry route a bulk order should open. */
  enquiryRoute: string;
  /** Sold as sets rather than single pieces, so the bulk framing leads. */
  bulkFirst?: boolean;
  /** Etsy sells this product by the set. */
  soldAsSet?: boolean;
  published?: string;
  updated?: string;
};

const ICON_COLOURS = ['Marble', 'Wood', 'Black', 'Brown', 'Grey', 'Pink', 'Red', 'White', 'Silk Gold', 'Silk White', 'Silk Bronze', 'Silk Black'];
const STATUE_COLOURS = ['Marble', 'White', 'Grey', 'Silk Bronze', 'Silk White', 'Silk Black', 'Silk Gold', 'Beige', 'Light Blue', 'Pink', 'Brown', 'Mint Green', 'Wood', 'Black'];
const LARGE_COLOURS = ['Marble', 'Wood', 'Silk Gold', 'Silk White', 'Silk Bronze', 'Grey', 'Blue', 'White', 'Green', 'Red'];

// These are the AUSTRALIAN prices, which is what this site must publish: the domain,
// the currency and the delivery promise are all Australian.
//
// They do not match what the Etsy API reports. Those listings carry regional pricing,
// and /listings/{id}/inventory returns only the base price charged everywhere else
// (45/65/95 here). The Australian figure is set per market and is not exposed by the
// v3 API at all, so it cannot be verified programmatically — check it against the
// listing's Australian view in Shop Manager before changing anything below.
const ICON_SIZES: ProductSize[] = [{ label: '15cm', price: 35 }, { label: '20cm', price: 55 }, { label: '25cm', price: 85 }];
const ICON_BASE_SIZES: ProductSize[] = [{ label: '15cm', price: 45 }, { label: '20cm', price: 65 }, { label: '25cm', price: 95 }];
// Verified in Shop Manager on 26 September 2026: all three sizes are AU$35 for
// Australian buyers. Review this possible underprice before changing the listing.
const MARY_ICON_SIZES: ProductSize[] = [{ label: '15cm', price: 35 }, { label: '20cm', price: 35 }, { label: '25cm', price: 35 }];
const MARY_ICON_BASE_SIZES: ProductSize[] = [{ label: '15cm', price: 35 }, { label: '20cm', price: 60 }, { label: '25cm', price: 105 }];
const STATUE_SIZES: ProductSize[] = [{ label: '15cm', price: 20 }, { label: '20cm', price: 45 }, { label: '25cm', price: 70 }, { label: '30cm', price: 95 }];
const LARGE_SIZES: ProductSize[] = [{ label: '15cm', price: 50 }, { label: '20cm', price: 90 }, { label: '25cm', price: 120 }, { label: '30cm', price: 140 }];

export const products: Product[] = [
  {
    slug: 'saint-charbel-statue', title: 'Saint Charbel statue', listingId: '1893943073',
    summary: 'A standing Saint Charbel statue, 3D printed in Sydney in fourteen finishes, from 15cm to 30cm.',
    intro: 'Saint Charbel stands in prayer with hands clasped and head bowed. Choose a 15cm to 30cm size and a marble, solid or silk finish.',
    sizes: STATUE_SIZES, colours: STATUE_COLOURS, enquiryRoute: 'bulk',
    reviews: ['judgeme-anika-dahdah'],
  },
  {
    slug: 'jesus-christ-sacred-heart', title: 'Jesus Christ “Sacred Heart” statue', listingId: '1893943095',
    summary: 'A standing Sacred Heart statue with arms outstretched, printed to order in fourteen finishes.',
    intro: 'Jesus stands with arms open and the Sacred Heart shown at the centre of the robe. Choose a 15cm to 30cm size and one of fourteen finishes.',
    sizes: STATUE_SIZES, colours: STATUE_COLOURS, enquiryRoute: 'bulk',
    reviews: ['judgeme-anthony-j', 'judgeme-nicole-s'],
  },
  {
    slug: 'saint-charbel', title: 'Saint Charbel sitting under a tree', listingId: '4432941364',
    summary: 'Saint Charbel seated beneath a tree with an open book. A larger, more detailed piece, 15cm to 30cm.',
    intro: 'Saint Charbel sits beneath a tree with an open book. This is a larger, more detailed design than the standing statue, available from 15cm to 30cm.',
    sizes: LARGE_SIZES, colours: LARGE_COLOURS, enquiryRoute: 'bulk',
  },
  {
    slug: 'saint-michael-statue', title: 'Saint Michael the Archangel, defeating the devil', listingId: '1760361490',
    summary: 'A full-figure Saint Michael statue in armour, subduing the serpent. Printed in PLA, 15cm to 30cm.',
    intro: 'Saint Michael stands in armour with raised wings over the defeated serpent. Choose a 15cm to 30cm size and one of ten finishes.',
    sizes: LARGE_SIZES, colours: LARGE_COLOURS, enquiryRoute: 'bulk',
    // Every Etsy review left on listing 1760361490, matched by listing id rather than by
    // reading the prose. scripts/etsy-sync.mjs reports any that are left unattached.
    reviews: ['judgeme-sheena-pal', 'judgeme-elias-el-tarraf', 'etsy-vojislav-2026-07-30', 'etsy-vojislav-2025-10-07', 'etsy-vojislav-2025-08-22', 'etsy-klaus-2025-08-07'],
    updated: '2026-09-21',
  },
  {
    slug: 'saint-michael-the-archangel-defender-of-faith-icon', title: 'Saint Michael the Archangel icon', listingId: '1893949429',
    summary: 'An arched relief icon of Saint Michael, 15cm to 25cm, in twelve finishes.',
    intro: 'A wall or shelf icon in arched relief, showing Saint Michael as protector. The relief is cut deep enough to hold a shadow, so the detail stays readable across the room rather than only up close.',
    sizes: ICON_SIZES, etsyBaseSizes: ICON_BASE_SIZES, colours: ICON_COLOURS, enquiryRoute: 'bulk',
    updated: '2026-09-21',
  },
  {
    slug: 'saint-george-the-victorious', title: 'Saint George the Victorious icon', listingId: '1879775206',
    summary: 'An arched relief icon of Saint George on horseback defeating the dragon, 15cm to 25cm.',
    intro: 'Saint George mounted, spear lowered, with the dragon beneath. A traditional subject for baptisms, confirmations and house blessings, and one that suits the deeper relief of the icon format.',
    sizes: ICON_SIZES, etsyBaseSizes: ICON_BASE_SIZES, colours: ICON_COLOURS, enquiryRoute: 'bulk',
    reviews: ['etsy-estelle-2026-03-03'],
    updated: '2026-09-21',
  },
  {
    slug: 'divine-jesus-christ-icon', title: 'Christ Pantocrator icon', listingId: '1879773522',
    summary: 'An arched relief icon of Christ holding a book, 15cm to 25cm, in twelve finishes.',
    intro: 'Christ is shown in blessing with a book in hand, in the Pantocrator tradition. This icon shares its arched shape and sizes with the Virgin Mary icon.',
    sizes: ICON_SIZES, etsyBaseSizes: ICON_BASE_SIZES, colours: ICON_COLOURS, enquiryRoute: 'bulk',
    updated: '2026-09-21',
  },
  {
    slug: 'virgin-mary-and-jesus-icon', title: 'Virgin Mary and Jesus icon', listingId: '1879771208',
    summary: 'An arched relief icon of the Virgin Mary holding the infant Jesus, 15cm to 25cm.',
    intro: 'The Virgin Mary holds the infant Christ in an arched relief icon. It shares its shape and sizes with the Christ Pantocrator icon.',
    sizes: MARY_ICON_SIZES, etsyBaseSizes: MARY_ICON_BASE_SIZES, colours: ICON_COLOURS, enquiryRoute: 'bulk',
    updated: '2026-09-26',
  },
  {
    slug: 'saint-nicholas-the-wonderworker', title: 'Saint Nicholas the Wonderworker icon', listingId: '1879769792',
    summary: 'An arched relief icon of Saint Nicholas the Wonderworker, 15cm to 25cm, in twelve finishes.',
    intro: 'Saint Nicholas shown in blessing, vested as a bishop. Part of the same arched icon range, so it matches the others in size, depth and finish if you are building a set.',
    sizes: ICON_SIZES, etsyBaseSizes: ICON_BASE_SIZES, colours: ICON_COLOURS, enquiryRoute: 'bulk',
    updated: '2026-09-21',
  },
  {
    slug: 'saint-paisios', title: 'Saint Paisios of Mount Athos icon', listingId: '4579336997',
    summary: 'An arched Orthodox icon of Saint Paisios of Mount Athos, 15cm to 25cm, in twelve finishes.',
    intro: 'Saint Paisios stands in his monastic habit with hands folded, framed by an arch with Orthodox knotwork around the border.',
    sizes: ICON_SIZES, colours: ICON_COLOURS, enquiryRoute: 'bulk',
    published: '2026-09-21', updated: '2026-09-21',
  },
  {
    slug: 'saint-joseph-icon', title: 'Saint Joseph and the child Jesus icon', listingId: '4579357288',
    summary: 'An arched icon of Saint Joseph holding the child Jesus, 15cm to 25cm, in twelve finishes.',
    intro: 'Saint Joseph holding the child Christ, a lily in his hand. The arch is cut deep enough to hold a shadow across the figures, which is what keeps the relief readable from across a room.',
    sizes: ICON_SIZES, colours: ICON_COLOURS, enquiryRoute: 'bulk',
    published: '2026-09-21', updated: '2026-09-21',
  },
  {
    slug: 'st-michael-icon-bonbonniere', title: 'Personalised Saint Michael icon bonbonniere', listingId: '4544225986',
    summary: '15cm Saint Michael icon favours for weddings and baptisms, sold in sets of five with optional text and boxing.',
    intro: 'A 15cm Saint Michael icon made as a guest favour. Add a name or date to the base if you wish. Choose an individual clear box with a gold or silver base and ribbon, or order the set unboxed.',
    // Sold in fives. Etsy has no minimum order quantity, so the set is the unit.
    sizes: [
      { label: '15cm, no box, set of 5', price: 100 }, { label: '15cm, boxed with ribbon, set of 5', price: 150 },
    ],
    colours: ['Marble', 'White', 'Grey', 'Beige/Bone', 'Sky Blue', 'Wood', 'Pink', 'Silk Gold', 'Silk White', 'Silk Bronze', 'Silk Black', 'Black', 'Matte Gold', 'Mint Green', 'Light Green', 'Dark Blue', 'Chocolate', 'Red', 'Orange', 'Purple', 'Yellow'],
    finishes: ['Light Blue', 'Light Pink', 'Light Green', 'Grey', 'Dark Blue', 'Dark Green', 'White', 'Black'],
    enquiryRoute: 'bulk', bulkFirst: true, soldAsSet: true,
    reviews: ['google-fadia-awad'],
    updated: '2026-09-26',
  },
  // Brought back from dormant Etsy listings on 21 September 2026. Each carries its own
  // price ladder rather than a shared constant: these were priced individually and none
  // of them matches STATUE_SIZES. Verified against the listings by scripts/etsy-sync.mjs.
  {
    slug: 'saint-peter-keeper-of-keys', title: 'Saint Peter “Keeper of Keys” statue', listingId: '1891536208',
    summary: 'Saint Peter holding the keys of heaven, 3D printed in Sydney from 15cm to 30cm in fourteen finishes.',
    intro: 'Saint Peter shown holding the keys, the emblem of his role as gatekeeper. A steady, upright composition that reads well on a shelf or altar table, and one that suits a confirmation or a parish gift.',
    sizes: [{ label: '15cm', price: 25 }, { label: '20cm', price: 60 }, { label: '25cm', price: 85 }, { label: '30cm', price: 110 }],
    colours: STATUE_COLOURS, enquiryRoute: 'bulk',
    updated: '2026-09-21',
  },
  {
    slug: 'saint-dominic-de-guzman-statue', title: 'Saint Dominic de Guzmán statue', listingId: '1887372006',
    summary: 'The founder of the Dominican Order in contemplation, printed to order from 15cm to 30cm.',
    intro: 'Saint Dominic, founder of the Dominican Order, is shown in his friar’s habit. Choose a 15cm to 30cm size and one of fourteen finishes.',
    sizes: [{ label: '15cm', price: 30 }, { label: '20cm', price: 55 }, { label: '25cm', price: 85 }, { label: '30cm', price: 105 }],
    colours: STATUE_COLOURS, enquiryRoute: 'bulk',
    updated: '2026-09-21',
  },
  {
    slug: 'immaculate-mary-statue', title: 'Immaculate Mary statue, defeating the serpent', listingId: '1901591525',
    summary: 'The Virgin Mary standing victorious over the serpent, 15cm to 30cm in fourteen finishes.',
    intro: 'The Virgin Mary stands over the serpent with hands open, in the Immaculate Conception tradition. Choose a 15cm to 30cm size and one of fourteen finishes.',
    sizes: [{ label: '15cm', price: 25 }, { label: '20cm', price: 60 }, { label: '25cm', price: 75 }, { label: '30cm', price: 95 }],
    colours: STATUE_COLOURS, enquiryRoute: 'bulk',
    updated: '2026-09-21',
  },
  {
    slug: 'saint-anthony-of-padua-statue', title: 'Saint Anthony of Padua statue', listingId: '4579346739',
    summary: 'Saint Anthony holding the child Jesus, on a base that can carry an inscription. 15cm to 30cm.',
    intro: 'Saint Anthony of Padua with the child Christ, a lily in his hand and a rosary at his side. The plinth is the point of this one: it can be cut with a name, a year or a dedication, so a set printed for a parish, a school or a feast day all matches.',
    sizes: [{ label: '15cm', price: 30 }, { label: '20cm', price: 55 }, { label: '25cm', price: 85 }, { label: '30cm', price: 105 }],
    colours: STATUE_COLOURS, enquiryRoute: 'bulk',
    published: '2026-09-21', updated: '2026-09-21',
  },
  {
    slug: 'saint-arnold-janssen-statue', title: 'Saint Arnold Janssen statue', listingId: '4579363684',
    summary: 'The founder of the Society of the Divine Word, on an inscribed base. 15cm to 30cm.',
    intro: 'Saint Arnold Janssen stands in his habit with hands folded. Add a name, year or dedication to the base if you wish.',
    sizes: STATUE_SIZES, colours: STATUE_COLOURS, enquiryRoute: 'bulk',
    published: '2026-09-21', updated: '2026-09-21',
  },
  // Sold in sets because they are ordered for a guest list. Etsy has no minimum order
  // quantity, so the set is the unit: the smallest purchase is five.
  {
    slug: 'first-tooth-favour-tag', title: 'Personalised first tooth favour tag', listingId: '4579373618',
    summary: 'Two-colour tooth-shaped favour tags for a first tooth celebration, with optional name text. Sets from five.',
    intro: 'A tooth-shaped tag to tie to a jar, favour box or snoubar bag. Choose the base and trim colours, and add a name if you wish.',
    sizes: [{ label: 'Set of 5', price: 20 }, { label: 'Set of 10', price: 40 }, { label: 'Set of 20', price: 80 }, { label: 'Set of 50', price: 200 }],
    colours: ['White', 'Beige', 'Pink', 'Blue', 'Purple', 'Gold'],
    enquiryRoute: 'bulk', bulkFirst: true, soldAsSet: true,
    published: '2026-09-21', updated: '2026-09-21',
  },
  {
    slug: 'pantocrator-icon-bonbonniere', title: 'Personalised Christ Pantocrator icon bonbonniere', listingId: '4579376840',
    summary: 'A 15cm Christ Pantocrator icon favour with optional base text and boxing. Sold in sets of five.',
    intro: 'A 15cm Christ Pantocrator icon made as a baptism or christening favour. Add a name to the base if you wish. Choose an individual clear box with a gold or silver base and ribbon, or order the set unboxed.',
    sizes: [{ label: '15cm, no box, set of 5', price: 100 }, { label: '15cm, boxed with ribbon, set of 5', price: 150 }],
    colours: ['White', 'Beige', 'Gold', 'Silver', 'Pink', 'Blue'],
    enquiryRoute: 'bulk', bulkFirst: true, soldAsSet: true,
    published: '2026-09-21', updated: '2026-09-26',
  },
  {
    slug: 'saint-elias-icon-bonbonniere', title: 'Personalised Saint Elias icon bonbonniere', listingId: '4579364231',
    summary: 'A 15cm Saint Elias icon favour for baptisms and name days. Sold in sets of five, boxed or unboxed.',
    intro: 'Saint Elias shown raising a sword in an arched icon. Add a name to the base if you wish. Each favour is 15cm high; choose individual clear boxes with a gold or silver base and ribbon, or order the set unboxed.',
    sizes: [{ label: '15cm, no box, set of 5', price: 100 }, { label: '15cm, boxed with ribbon, set of 5', price: 150 }],
    colours: ['White', 'Beige', 'Gold', 'Silver', 'Pink', 'Blue', 'Marble', 'Gray'],
    enquiryRoute: 'bulk', bulkFirst: true, soldAsSet: true,
    published: '2026-09-21', updated: '2026-09-26',
  },
  {
    slug: 'personalised-rose-sculpture', title: 'Personalised rose sculpture', listingId: '4579360791',
    summary: 'Long-stem rose favours with optional base text and individual gift boxes. Sets of five to fifty.',
    intro: 'A long-stem rose with leaves on a round base. Add a name or short line if you wish, and choose individual clear boxes with ribbon or order the set unboxed.',
    sizes: [
      { label: 'Set of 5, no box', price: 30 }, { label: 'Set of 5, boxed', price: 55 },
      { label: 'Set of 10, no box', price: 60 }, { label: 'Set of 10, boxed', price: 110 },
      { label: 'Set of 20, no box', price: 120 }, { label: 'Set of 20, boxed', price: 220 },
      { label: 'Set of 50, no box', price: 300 }, { label: 'Set of 50, boxed', price: 550 },
    ],
    colours: ['Yellow', 'Red', 'White', 'Pink', 'Gold', 'Purple'],
    enquiryRoute: 'bulk', bulkFirst: true, soldAsSet: true,
    published: '2026-09-21', updated: '2026-09-26',
  },
  // Sold at one price rather than a size ladder, so `sizes` carries a single entry and
  // the page drops the size table and the "depending on size" qualifier.
  {
    slug: 'orthodox-cross-car-hanger', title: 'Orthodox cross car hanger', listingId: '4579344605',
    summary: 'A two-tone budded Orthodox cross on a black cord, made to hang from a rear view mirror.',
    intro: 'A budded Orthodox cross printed in two tones so the outline reads clearly against the inner cross, finished on a black cord. Light enough to hang without swinging, and small enough not to block the view. A common request as a baptism favour, a name day gift or a blessing for a new driver.',
    sizes: [{ label: 'One size', price: 10 }],
    colours: ['Black and gold'], enquiryRoute: 'bulk',
    published: '2026-09-21', updated: '2026-09-21',
  },
  {
    slug: 'personalised-christmas-tree', title: 'Personalised Christmas tree place setting', listingId: '4579361528',
    summary: 'A tiered Christmas tree with a name star topper, in Silk White, Mint Green or Silk Gold.',
    intro: 'A tiered Christmas tree with a name star topper. The tiers twist apart. Choose Silk White, Mint Green or Silk Gold, and add a name if you wish.',
    sizes: [{ label: 'One size', price: 40 }],
    colours: ['Silk White', 'Mint Green', 'Silk Gold'],
    enquiryRoute: 'bulk', bulkFirst: true,
    published: '2026-09-21', updated: '2026-09-21',
  },
  {
    slug: 'christening-coaster-bonbonniere', title: 'Personalised christening coaster bonbonniere', listingId: '4311901365',
    summary: '10cm white christening coasters with a cross and dove, optional name and date, and boxed or unboxed sets.',
    intro: 'A flat 10cm white coaster with a cross and dove. Add a name and date if you wish, choose a trim colour, and order a boxed or unboxed set for your guests.',
    sizes: [
      { label: 'Set of 5, no box', price: 60 }, { label: 'Set of 5, boxed', price: 85 },
      { label: 'Set of 10, no box', price: 110 }, { label: 'Set of 10, boxed', price: 160 },
      { label: 'Set of 15, no box', price: 150 }, { label: 'Set of 15, boxed', price: 225 },
      { label: 'Set of 20, no box', price: 180 }, { label: 'Set of 20, boxed', price: 280 },
    ],
    colours: ['Silk Gold', 'Silk White', 'Silk Bronze', 'Silk Black', 'White', 'Black', 'Grey', 'Pink', 'Sky Blue', 'Brown', 'Light Green', 'Beige', 'Mint Green', 'Cyan'],
    enquiryRoute: 'bulk', bulkFirst: true, soldAsSet: true,
    updated: '2026-09-26',
  },
];

export const aud = (amount: number) => `AU$${amount}`;
export const getProduct = (slug: string) => products.find(product => product.slug === slug);
/** Deep link to the listing itself, never the shop front: a visitor who has just read
 *  about one piece should not have to find it again among two dozen others.
 *
 *  The campaign parameters are what make the click measurable. Etsy reports traffic by
 *  source and content, so `utm_content` carrying the slug is the only way to see which
 *  of these pages actually sends buyers rather than merely ranking. */
export const etsyUrl = (product: Product) =>
  `${etsyListingUrl(product)}?utm_source=isculptures&utm_medium=referral&utm_campaign=product-page&utm_content=${product.slug}`;

/** The same destination without campaign parameters, for schema.org `offers.url`.
 *  Structured data should name the canonical place to buy, not a tagged copy of it. */
export const etsyListingUrl = (product: Product) => `https://www.etsy.com/au/listing/${product.listingId}/`;
export const priceRange = (product: Product) => {
  const prices = product.sizes.map(size => size.price);
  return { low: Math.min(...prices), high: Math.max(...prices) };
};
