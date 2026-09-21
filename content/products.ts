// The studio's Etsy catalogue, mirrored onto its own domain.
//
// Every slug here matches a Shopify product URL that previously redirected to Etsy, so
// those URLs become real pages again rather than sending their ranking to a marketplace.
// The two bonbonniere entries are new: they are the studio's core bulk business and had
// nothing on the site pointing at them.
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
// Unverified: this is the ladder the API reports, and no Australian price has been read
// off Shop Manager for this piece. If it also carries a regional price, `sizes` here is
// wrong in the same way the four icons above were.
const MARY_ICON_SIZES: ProductSize[] = [{ label: '15cm', price: 35 }, { label: '20cm', price: 60 }, { label: '25cm', price: 105 }];
const STATUE_SIZES: ProductSize[] = [{ label: '15cm', price: 20 }, { label: '20cm', price: 45 }, { label: '25cm', price: 70 }, { label: '30cm', price: 95 }];
const LARGE_SIZES: ProductSize[] = [{ label: '15cm', price: 50 }, { label: '20cm', price: 90 }, { label: '25cm', price: 120 }, { label: '30cm', price: 140 }];

export const products: Product[] = [
  {
    slug: 'saint-charbel-statue', title: 'Saint Charbel “Revered” statue', listingId: '1893943073',
    summary: 'A standing Saint Charbel statue, 3D printed in Sydney in fourteen finishes, from 15cm to 30cm.',
    intro: 'Saint Charbel shown standing in prayer, hands clasped and head bowed. The detail holds up at every size, and the finish changes the character of the piece completely: marble and beige read as stone, while the silk range catches the light.',
    sizes: STATUE_SIZES, colours: STATUE_COLOURS, enquiryRoute: 'bulk',
    reviews: ['judgeme-anika-dahdah'],
  },
  {
    slug: 'jesus-christ-sacred-heart', title: 'Jesus Christ “Sacred Heart” statue', listingId: '1893943095',
    summary: 'A standing Sacred Heart statue with arms outstretched, printed to order in fourteen finishes.',
    intro: 'The Sacred Heart shown with arms open in welcome. A common request for a family home, a parish gift or a confirmation present, and one of the pieces most often ordered in a batch for an occasion.',
    sizes: STATUE_SIZES, colours: STATUE_COLOURS, enquiryRoute: 'bulk',
    reviews: ['judgeme-anthony-j', 'judgeme-nicole-s'],
  },
  {
    slug: 'saint-charbel', title: 'Saint Charbel sitting under a tree', listingId: '4432941364',
    summary: 'Saint Charbel seated beneath a tree with an open book. A larger, more detailed piece, 15cm to 30cm.',
    intro: 'A seated composition: Saint Charbel beneath a tree with an open book in his hands, a scene associated with contemplation and study. More involved to print than the standing figure, which is why it sits in a higher size and price range.',
    sizes: LARGE_SIZES, colours: LARGE_COLOURS, enquiryRoute: 'bulk',
  },
  {
    slug: 'saint-michael-statue', title: 'Saint Michael the Archangel, defeating the devil', listingId: '1760361490',
    summary: 'A full-figure Saint Michael statue in armour, subduing the serpent. Printed in PLA, 15cm to 30cm.',
    intro: 'Saint Michael in armour, wings raised, standing over the defeated serpent. The most requested piece in the range and the one customers most often come back for, usually in the silk finishes where the armour catches the light.',
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
    slug: 'divine-jesus-christ-icon', title: 'Divine Jesus Christ icon', listingId: '1879773522',
    summary: 'An arched relief icon of Christ holding a book, 15cm to 25cm, in twelve finishes.',
    intro: 'Christ shown in blessing with a book in hand, in the Pantocrator tradition. Often ordered as a pair with the Virgin Mary icon, which shares the same arch and sizes so the two sit together.',
    sizes: ICON_SIZES, etsyBaseSizes: ICON_BASE_SIZES, colours: ICON_COLOURS, enquiryRoute: 'bulk',
    updated: '2026-09-21',
  },
  {
    slug: 'virgin-mary-and-jesus-icon', title: 'Virgin Mary and Jesus icon', listingId: '1879771208',
    summary: 'An arched relief icon of the Virgin Mary holding the infant Jesus, 15cm to 25cm.',
    intro: 'The Virgin Mary with the infant Christ, in the same arched relief and sizes as the Divine Jesus Christ icon. The two are frequently ordered together as a matching pair.',
    sizes: MARY_ICON_SIZES, colours: ICON_COLOURS, enquiryRoute: 'bulk',
    updated: '2026-09-21',
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
    intro: 'Saint Paisios in his monastic habit, hands folded, set within an arched frame with traditional Orthodox knotwork around the border. A modern Athonite elder, and a subject asked for far more often than the range previously covered.',
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
    summary: 'Saint Michael icon favours for weddings, christenings and baptisms. Boxed with ribbon and personalised with a name and date.',
    intro: 'A small Saint Michael icon made as a guest favour. Each piece can carry a name, and a date if you want one. Choose it boxed with ribbon for handing out on the day, or unboxed if you are packaging it yourself.',
    // Sold in fives. Etsy has no minimum order quantity, so the set is the unit and the
    // per-piece price ($15/$25/$20/$30) is unchanged; a buyer wanting twenty orders four.
    sizes: [
      { label: '12cm, no box, set of 5', price: 75 }, { label: '12cm, boxed with ribbon, set of 5', price: 125 },
      { label: '15cm, no box, set of 5', price: 100 }, { label: '15cm, boxed with ribbon, set of 5', price: 150 },
    ],
    colours: ['Marble', 'White', 'Grey', 'Beige/Bone', 'Sky Blue', 'Wood', 'Pink', 'Silk Gold', 'Silk White', 'Silk Bronze', 'Silk Black', 'Black', 'Matte Gold', 'Mint Green', 'Light Green', 'Dark Blue', 'Chocolate', 'Red', 'Orange', 'Purple', 'Yellow'],
    finishes: ['Light Blue', 'Light Pink', 'Light Green', 'Grey', 'Dark Blue', 'Dark Green', 'White', 'Black'],
    enquiryRoute: 'bulk', bulkFirst: true,
    reviews: ['google-fadia-awad'],
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
    intro: 'Saint Dominic shown in contemplation, the founder of the Dominican Order. Most often ordered for a school, a parish or a religious community, where a set in one finish suits a hall or classroom better than a single piece.',
    sizes: [{ label: '15cm', price: 30 }, { label: '20cm', price: 55 }, { label: '25cm', price: 85 }, { label: '30cm', price: 105 }],
    colours: STATUE_COLOURS, enquiryRoute: 'bulk',
    updated: '2026-09-21',
  },
  {
    slug: 'immaculate-mary-statue', title: 'Immaculate Mary statue, defeating the serpent', listingId: '1901591525',
    summary: 'The Virgin Mary standing victorious over the serpent, 15cm to 30cm in fourteen finishes.',
    intro: 'The Virgin Mary standing over the serpent, hands open, in the Immaculate Conception tradition. A counterpart to the Saint Michael statue in both subject and scale, and frequently ordered alongside it as a pair.',
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
    intro: 'Saint Arnold Janssen standing in his habit, hands folded, on a plinth that can carry a dedication. Rarely available as a statue at all, and asked for by Divine Word parishes, SVD communities and the schools attached to them.',
    sizes: STATUE_SIZES, colours: STATUE_COLOURS, enquiryRoute: 'bulk',
    published: '2026-09-21', updated: '2026-09-21',
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
    intro: 'A tiered tree with a star on top carrying a name, made as a place setting or a small gift for each guest at Christmas dinner. The tiers twist apart, and the star is cut with whatever wording you give us. Ordered most often as a full table set rather than singly.',
    sizes: [{ label: 'One size', price: 40 }],
    colours: ['Silk White', 'Mint Green', 'Silk Gold'],
    enquiryRoute: 'bulk', bulkFirst: true,
    published: '2026-09-21', updated: '2026-09-21',
  },
  {
    slug: 'christening-coaster-bonbonniere', title: 'Personalised christening coaster bonbonniere', listingId: '4311901365',
    summary: 'A 10cm personalised christening coaster with name, date, cross and dove. Sold in sets from 5 to 20.',
    intro: 'A flat 10cm coaster carrying the child’s name and the date, with a cross and dove. Sold in sets, so it suits a guest list rather than a single gift. For larger christenings and parish events, tell us your numbers and we will quote the full run.',
    sizes: [
      { label: 'Set of 5', price: 65 }, { label: 'Set of 10', price: 120 },
      { label: 'Set of 15', price: 160 }, { label: 'Set of 20', price: 200 },
    ],
    colours: ['Silk Gold', 'Silk White', 'Silk Bronze', 'Silk Black', 'White', 'Black', 'Grey', 'Pink', 'Sky Blue', 'Brown', 'Light Green', 'Beige', 'Mint Green', 'Cyan'],
    enquiryRoute: 'bulk', bulkFirst: true,
  },
];

export const aud = (amount: number) => `AU$${amount}`;
export const getProduct = (slug: string) => products.find(product => product.slug === slug);
export const etsyUrl = (product: Product) => `https://www.etsy.com/au/listing/${product.listingId}/`;
export const priceRange = (product: Product) => {
  const prices = product.sizes.map(size => size.price);
  return { low: Math.min(...prices), high: Math.max(...prices) };
};
