// "About this piece" copy for each product page: two or three sentences that a buyer can't get
// from the photo or the price table. Built only from facts already on the site or confirmed by
// the owner (see "Confirmed studio facts" in docs/guide-drafting.md). Feast dates come from the
// church-shop guide, which cites its sources. Don't add materials, care advice or capacity claims
// here that the owner hasn't confirmed.
//
// `guide` links the piece to the blog post most useful to someone buying it. The product page
// fails the build if the slug doesn't match a guide in content/guides.ts.
export type ProductDetail = { details: string[]; guide?: string };

const CHURCH_SHOPS = 'wholesale-saint-statues-icons-church-shops';
const CHRISTENING = 'christening-baptism-keepsakes';

export const productDetails: Record<string, ProductDetail> = {
  'saint-charbel-statue': {
    details: [
      'Four sizes from 15cm to 30cm, so the same statue can sit on a bedside table or stand out on a home altar or shop shelf, in 19 colours including marble and silk finishes.',
      'Saint Charbel’s feast is the third Sunday of July in the Maronite calendar and 24 July in the Latin calendar. Allow at least two weeks if you want the statue for the day.',
    ],
    guide: CHURCH_SHOPS,
  },
  'jesus-christ-sacred-heart': {
    details: [
      'Printed in four sizes from 15cm to 30cm and 19 colours, from plain white to silk gold.',
      'It suits a home altar, a confirmation gift or a house blessing. For a parish, school or church shop, a batch can mix sizes and colours and is quoted together.',
    ],
    guide: CHURCH_SHOPS,
  },
  'saint-charbel': {
    details: [
      'The most detailed of our Saint Charbel pieces: he sits beneath a tree with an open book, which is why it costs more than the standing statue at each size.',
      'Choose from 15cm to 30cm and 19 colours. The larger sizes show the leaves and the pages of the book most clearly.',
    ],
    guide: CHURCH_SHOPS,
  },
  'saint-michael-statue': {
    details: [
      'Our most reviewed piece: read what customers said about it below. It comes in four sizes from 15cm to 30cm and 19 colours.',
      'Saint Michael’s feast, with Saints Gabriel and Raphael, is 29 September in the Roman Catholic calendar. Orthodox churches keep the Synaxis of the Archangel Michael on 8 November.',
    ],
    guide: CHURCH_SHOPS,
  },
  'saint-michael-the-archangel-defender-of-faith-icon': {
    details: [
      'Made to hang on a wall or stand on a shelf, in three sizes from 15cm to 25cm and 19 colours.',
      'It pairs with our Saint Michael statue if you want the archangel in both forms. Either feast day, 29 September (Roman Catholic) or 8 November (Orthodox Synaxis), is a natural time to give it.',
    ],
    guide: CHURCH_SHOPS,
  },
  'saint-george-the-victorious': {
    details: [
      'Three sizes from 15cm to 25cm and 19 colours, from white to silk gold.',
      'The arched shape and depth match the rest of our icon range, so Saint George can hang as part of a set with Saint Michael or Saint Nicholas.',
    ],
    guide: CHURCH_SHOPS,
  },
  'divine-jesus-christ-icon': {
    details: [
      'Three sizes from 15cm to 25cm in 19 colours, and it hangs as a pair with the Virgin Mary and Jesus icon.',
      'For a baptism or christening, the same Pantocrator design also comes as a 15cm favour in sets of five, boxed or unboxed: see the Christ Pantocrator icon bonbonniere.',
    ],
    guide: CHRISTENING,
  },
  'virgin-mary-and-jesus-icon': {
    details: [
      'Three sizes from 15cm to 25cm and 19 colours.',
      'It matches the Christ Pantocrator icon in shape and size, so the two can hang side by side. A church shop can order both in one batch.',
    ],
    guide: CHURCH_SHOPS,
  },
  'saint-nicholas-the-wonderworker': {
    details: [
      'Three sizes from 15cm to 25cm in 19 colours. Our photo shows the gold finish; white, marble and silk finishes are also available.',
      'It matches the other icons in our range in shape and depth, so it can join Saint George or Saint Michael in a set.',
    ],
    guide: CHURCH_SHOPS,
  },
  'saint-paisios': {
    details: [
      'Three sizes from 15cm to 25cm in 19 colours. Our photo shows it in white.',
      'Like all our icons, a church shop or parish can order it in a batch, mixed with other saints, sizes and colours.',
    ],
    guide: CHURCH_SHOPS,
  },
  'saint-joseph-icon': {
    details: [
      'Three sizes from 15cm to 25cm in 19 colours.',
      'Saint Joseph’s feast as spouse of the Blessed Virgin Mary is 19 March in the Roman Catholic calendar, a natural date for a gift or a parish order. Allow at least two weeks.',
    ],
    guide: CHURCH_SHOPS,
  },
  'st-gabriel-icon-bonbonniere': {
    details: [
      'Each favour is 15cm, sold in sets of five, with a name or date on the base if you want one.',
      'Boxed sets come in individual clear boxes with ribbon in eight colours. For a wedding or baptism, allow at least two weeks, and up to a month for a larger batch.',
    ],
    guide: 'personalised-wedding-bonbonniere',
  },
  'saint-peter-keeper-of-keys': {
    details: [
      'Four sizes from 15cm to 30cm in 19 colours.',
      'For a confirmation or a parish gift, a batch can mix sizes and colours, and larger quantities bring the price per piece down.',
    ],
    guide: CHURCH_SHOPS,
  },
  'saint-dominic-de-guzman-statue': {
    details: [
      'Our photo shows it in white, holding a book and a lily. It comes in four sizes from 15cm to 30cm and 19 colours.',
      'For a Dominican parish, school or community, a batch can mix sizes and colours and is quoted together.',
    ],
    guide: CHURCH_SHOPS,
  },
  'immaculate-mary-statue': {
    details: [
      'Four sizes from 15cm to 30cm in 19 colours.',
      'It suits a home altar, a parish gift or a church shop shelf. For larger orders, the price per piece comes down.',
    ],
    guide: CHURCH_SHOPS,
  },
  'saint-anthony-of-padua-statue': {
    details: [
      'Four sizes from 15cm to 30cm in 19 colours, with the base cut with a name, year or dedication if you want one.',
      'Our photo shows four finishes side by side, each on an inscribed base: one way to give a matching set to a parish, school or family.',
    ],
    guide: CHURCH_SHOPS,
  },
  'saint-arnold-janssen-statue': {
    details: [
      'Four sizes from 15cm to 30cm in 19 colours. Our photo shows speckled marble.',
      'Add a name, year or dedication to the base, which suits a gift for a Divine Word school or parish.',
    ],
    guide: CHURCH_SHOPS,
  },
  'first-tooth-favour-tag': {
    details: [
      'Each tag is about 6cm tall, in a base colour and a trim colour you choose, with a name if you want one. Sets run from 5 to 50.',
      'It doesn’t have to be a tooth: this design began as one family’s request, and we design tags in any shape you ask for.',
    ],
    guide: 'personalised-baby-shower-keepsakes',
  },
  'pantocrator-icon-bonbonniere': {
    details: [
      'A 15cm favour sold in sets of five, boxed or unboxed, in 18 colours.',
      'Add the child’s name to the base or leave it plain. For a christening, allow at least two weeks, and up to a month for a larger batch.',
    ],
    guide: CHRISTENING,
  },
  'saint-elias-icon-bonbonniere': {
    details: [
      'A 15cm favour for baptisms and name days, in sets of five, boxed or unboxed, in 18 colours.',
      'Add a name to the base or leave it plain. Allow at least two weeks, and up to a month for a larger batch.',
    ],
    guide: CHRISTENING,
  },
  'personalised-rose-sculpture': {
    details: [
      'Each rose is about 10cm tall, with the rose and base colours chosen separately and a name or short line on the base if you want one.',
      'Choose individual clear boxes with ribbon or an unboxed set, from 5 to 50 roses. For 50 or more, allow at least three weeks, and up to a month.',
    ],
    guide: 'personalised-baby-shower-keepsakes',
  },
  'orthodox-cross-car-hanger': {
    details: [
      'One size, printed in two tones on a black cord.',
      'For baptism favours or a parish order, larger quantities bring the price per piece down. Tell us how many you need.',
    ],
    guide: CHRISTENING,
  },
  'personalised-christmas-tree': {
    details: [
      'Each tree stands about 15cm tall, and the name on the star is optional.',
      'For a Christmas dinner or work party, trees can be boxed one by one or packed by table. For 50 or more, allow at least three weeks, and up to a month.',
    ],
    guide: 'personalised-christmas-place-settings',
  },
  'christening-coaster-bonbonniere': {
    details: [
      'A flat 10cm coaster with a cross and dove, and the child’s name and date if you want them.',
      'Choose a trim colour, and a boxed or unboxed set of 5 to 20. Allow at least two weeks, and up to a month for a larger batch.',
    ],
    guide: CHRISTENING,
  },
};
