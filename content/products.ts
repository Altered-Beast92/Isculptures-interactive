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

const ICON_SIZES: ProductSize[] = [{ label: '15cm', price: 35 }, { label: '20cm', price: 55 }, { label: '25cm', price: 85 }];
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
    reviews: ['judgeme-sheena-pal', 'judgeme-elias-el-tarraf', 'etsy-vojislav-2026-07-30'],
  },
  {
    slug: 'saint-michael-the-archangel-defender-of-faith-icon', title: 'Saint Michael the Archangel icon', listingId: '1893949429',
    summary: 'An arched relief icon of Saint Michael, 15cm to 25cm, in twelve finishes.',
    intro: 'A wall or shelf icon in arched relief, showing Saint Michael as protector. The relief is cut deep enough to hold a shadow, so the detail stays readable across the room rather than only up close.',
    sizes: ICON_SIZES, colours: ICON_COLOURS, enquiryRoute: 'bulk',
  },
  {
    slug: 'saint-george-the-victorious', title: 'Saint George the Victorious icon', listingId: '1879775206',
    summary: 'An arched relief icon of Saint George on horseback defeating the dragon, 15cm to 25cm.',
    intro: 'Saint George mounted, spear lowered, with the dragon beneath. A traditional subject for baptisms, confirmations and house blessings, and one that suits the deeper relief of the icon format.',
    sizes: ICON_SIZES, colours: ICON_COLOURS, enquiryRoute: 'bulk',
    reviews: ['etsy-estelle-2026-03-03'],
  },
  {
    slug: 'divine-jesus-christ-icon', title: 'Divine Jesus Christ icon', listingId: '1879773522',
    summary: 'An arched relief icon of Christ holding a book, 15cm to 25cm, in twelve finishes.',
    intro: 'Christ shown in blessing with a book in hand, in the Pantocrator tradition. Often ordered as a pair with the Virgin Mary icon, which shares the same arch and sizes so the two sit together.',
    sizes: ICON_SIZES, colours: ICON_COLOURS, enquiryRoute: 'bulk',
  },
  {
    slug: 'virgin-mary-and-jesus-icon', title: 'Virgin Mary and Jesus icon', listingId: '1879771208',
    summary: 'An arched relief icon of the Virgin Mary holding the infant Jesus, 15cm to 25cm.',
    intro: 'The Virgin Mary with the infant Christ, in the same arched relief and sizes as the Divine Jesus Christ icon. The two are frequently ordered together as a matching pair.',
    sizes: ICON_SIZES, colours: ICON_COLOURS, enquiryRoute: 'bulk',
  },
  {
    slug: 'saint-nicholas-the-wonderworker', title: 'Saint Nicholas the Wonderworker icon', listingId: '1879769792',
    summary: 'An arched relief icon of Saint Nicholas the Wonderworker, 15cm to 25cm, in twelve finishes.',
    intro: 'Saint Nicholas shown in blessing, vested as a bishop. Part of the same arched icon range, so it matches the others in size, depth and finish if you are building a set.',
    sizes: ICON_SIZES, colours: ICON_COLOURS, enquiryRoute: 'bulk',
  },
  {
    slug: 'st-michael-icon-bonbonniere', title: 'Personalised Saint Michael icon bonbonniere', listingId: '4544225986',
    summary: 'Saint Michael icon favours for weddings, christenings and baptisms. Boxed with ribbon and personalised with a name and date.',
    intro: 'A small Saint Michael icon made as a guest favour. Each piece can carry a name, and a date if you want one. Choose it boxed with ribbon for handing out on the day, or unboxed if you are packaging it yourself.',
    sizes: [
      { label: '12cm, no box', price: 15 }, { label: '12cm, boxed with ribbon', price: 25 },
      { label: '15cm, no box', price: 20 }, { label: '15cm, boxed with ribbon', price: 30 },
    ],
    colours: ['Marble', 'White', 'Grey', 'Beige/Bone', 'Sky Blue', 'Wood', 'Pink', 'Silk Gold', 'Silk White', 'Silk Bronze', 'Silk Black', 'Black', 'Matte Gold', 'Mint Green', 'Light Green', 'Dark Blue', 'Chocolate', 'Red', 'Orange', 'Purple', 'Yellow'],
    finishes: ['Light Blue', 'Light Pink', 'Light Green', 'Grey', 'Dark Blue', 'Dark Green', 'White', 'Black'],
    enquiryRoute: 'bulk', bulkFirst: true,
    reviews: ['google-fadia-awad'],
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
