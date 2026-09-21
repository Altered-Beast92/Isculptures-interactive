import { notFound } from 'next/navigation';
import { products, getProduct, etsyUrl, etsyListingUrl, priceRange, aud } from '../../../content/products';
import { testimonials } from '../../../content/testimonials';
import { SOURCE_LABELS } from '../../../content/types';
import media from '../../../content/product-media.json';
import { CONTACT, SITE_URL, pageMetadata, CONTENT_DATES } from '../../../lib/site';
import { reviewSchema, productRating } from '../../../lib/reviews';
import Breadcrumbs from '../../components/breadcrumbs';

export const dynamicParams = false;
export const generateStaticParams = () => products.map(({ slug }) => ({ slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  return product ? pageMetadata(product.title, product.summary, '/products/' + slug) : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const photos = media[slug as keyof typeof media];
  const { low, high } = priceRange(product);
  const reviews = (product.reviews ?? []).flatMap(id => testimonials.filter(review => review.id === id));
  const rating = productRating(reviews);
  const updated = product.updated ?? CONTENT_DATES.site.updated;
  const buy = etsyUrl(product);
  // Schema names the canonical listing; the visible links carry the campaign tags.
  const canonicalBuy = etsyListingUrl(product);
  const enquiry = '/enquiry?route=' + product.enquiryRoute;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': SITE_URL + '/products/' + slug + '#product',
    name: product.title,
    description: product.summary,
    image: photos.map(photo => SITE_URL + photo.src),
    brand: { '@type': 'Brand', name: CONTACT.name },
    manufacturer: { '@id': SITE_URL + '/#organisation' },
    material: 'PLA',
    // An AggregateOffer covers the size range, because every size is a separate variant
    // on the listing this page links to. A piece sold at one price is a plain Offer:
    // an AggregateOffer whose low and high match is a weaker signal than a real price.
    offers: low === high
      ? { '@type': 'Offer', priceCurrency: 'AUD', price: low, availability: 'https://schema.org/InStock', url: canonicalBuy, seller: { '@id': SITE_URL + '/#organisation' } }
      : {
          '@type': 'AggregateOffer',
          priceCurrency: 'AUD',
          lowPrice: low,
          highPrice: high,
          offerCount: product.sizes.length,
          availability: 'https://schema.org/InStock',
          url: canonicalBuy,
          seller: { '@id': SITE_URL + '/#organisation' },
        },
    ...(rating ? { aggregateRating: rating, review: reviews.map(reviewSchema) } : {}),
  };

  return <main id="main-content" className="document-page product-page"><article>
    <Breadcrumbs items={[{ name: 'Products', path: '/products' }, { name: product.title, path: '/products/' + slug }]}/>

    <header className="service-hero">
      <div>
        <p className="section-tag">{product.bulkFirst ? 'FAVOURS & BONBONNIERE' : 'STATUES & ICONS'}</p>
        <h1>{product.title}</h1>
        <p className="document-lede">{product.intro}</p>
        <p className="product-price">{aud(low)}{low !== high && <><span>{` – ${aud(high)}`}</span> <small>depending on size</small></>}</p>
        <div className="product-actions">
          {product.bulkFirst
            ? <>
                <a className="primary" href={enquiry}>Order 10+ for your event <span aria-hidden="true">↗</span></a>
                <a className="secondary" href={buy} target="_blank" rel="noopener">Buy a single set on Etsy ↗</a>
              </>
            : <>
                <a className="primary" href={buy} target="_blank" rel="noopener">Buy on Etsy <span aria-hidden="true">↗</span></a>
                <a className="secondary" href={enquiry}>Order 10+ for your event or parish ↗</a>
              </>}
        </div>
        <p className="product-note">Printed to order in our Sydney studio and delivered Australia-wide. For a parish, school or event order, tell us your numbers and we will quote the whole run.</p>
      </div>
      <figure className="product-hero-image">
        <img src={photos[0].src} srcSet={`${photos[0].src.replace('.webp', '-small.webp')} ${photos[0].smallWidth}w, ${photos[0].src} ${photos[0].width}w`} sizes="(max-width: 700px) 88vw, 40vw" alt={photos[0].alt} width={photos[0].width} height={photos[0].height}/>
      </figure>
    </header>

    <section className="product-options">
      <div>
        {/* A piece made in one size only gets a plain price line: a two-column table
            with a single row reads as though options are missing. */}
        {product.sizes.length > 1 ? <>
          <h2>Sizes and prices</h2>
          <table className="product-sizes">
            <thead><tr><th scope="col">Size</th><th scope="col">Price</th></tr></thead>
            <tbody>{product.sizes.map(size => <tr key={size.label}><th scope="row">{size.label}</th><td>{aud(size.price)}</td></tr>)}</tbody>
          </table>
        </> : <>
          <h2>Price</h2>
          <p className="product-single-price">{aud(product.sizes[0].price)} <small>{product.sizes[0].label}</small></p>
        </>}
        <p className="product-note">Prices are per piece as listed on Etsy. Batches of ten or more are quoted separately.</p>
      </div>
      <div>
        <h2>Finishes</h2>
        <ul className="product-colours">{product.colours.map(colour => <li key={colour}>{colour}</li>)}</ul>
        {product.finishes && <>
          <h3>Ribbon colours</h3>
          <ul className="product-colours">{product.finishes.map(finish => <li key={finish}>{finish}</li>)}</ul>
        </>}
      </div>
    </section>

    {photos.length > 1 && <section className="product-gallery">
      <h2>More photographs</h2>
      <div className="product-gallery-grid">{photos.slice(1).map(photo => <img key={photo.src} src={photo.src} srcSet={`${photo.src.replace('.webp', '-small.webp')} ${photo.smallWidth}w, ${photo.src} ${photo.width}w`} sizes="(max-width: 700px) 88vw, 44vw" alt={photo.alt} width={photo.width} height={photo.height} loading="lazy"/>)}</div>
    </section>}

    {reviews.length > 0 && <section className="product-reviews">
      <h2>What customers said about this piece</h2>
      <div className="testimonial-grid">{reviews.map(review => <figure className="testimonial-card" key={review.id}>
        <div className="testimonial-rating" role="img" aria-label={`${review.rating} out of 5 stars`}><span aria-hidden="true">★★★★★</span></div>
        <blockquote>“{review.quote}”</blockquote>
        <figcaption><strong>{review.author}</strong><small>{SOURCE_LABELS[review.source]}</small></figcaption>
      </figure>)}</div>
    </section>}

    <section className="product-enquiry">
      <h2>Ordering more than one?</h2>
      <p>Our minimum for a custom batch is 10 units. Names, dates and colours can change piece to piece, and we can quote packaging, ribbon and delivery with it. Tell us your numbers and the date you need them by.</p>
      <div className="portfolio-actions">
        <a className="primary" href={enquiry}>Get a bulk quote ↗</a>
        <a href={'tel:' + CONTACT.tel}>Or call {CONTACT.phone}</a>
      </div>
    </section>

    <p className="product-updated"><time dateTime={updated}>Prices checked {updated}</time></p>
  </article><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/></main>;
}
