import { products, priceRange, aud } from '../../content/products';
import media from '../../content/product-media.json';
import { SITE_URL, pageMetadata } from '../../lib/site';
import Breadcrumbs from '../components/breadcrumbs';

export const metadata = pageMetadata(
  'Statues, icons and bonbonniere',
  'Shop 3D printed statues, religious icons and personalised bonbonniere made in Sydney. View current prices and options, or ask about a custom batch.',
  '/products',
);

export default function ProductsPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': SITE_URL + '/products#collection',
    url: SITE_URL + '/products',
    name: 'Statues, icons and bonbonniere',
    about: { '@id': SITE_URL + '/#organisation' },
    hasPart: products.map(product => ({ '@type': 'Product', name: product.title, url: SITE_URL + '/products/' + product.slug })),
  };

  return <main id="main-content" className="document-page"><article>
    <Breadcrumbs items={[{ name: 'Products', path: '/products' }]}/>
    <p className="section-tag">STATUES, ICONS &amp; BONBONNIERE</p>
    <h1>Pieces we make</h1>
    <p className="document-lede">Statues, icons and favours made in our Sydney studio. View sizes, colours and prices here, then buy on Etsy or ask us about a custom batch.</p>

    <div className="product-grid">{products.map(product => {
      const photo = media[product.slug as keyof typeof media][0];
      const { low, high } = priceRange(product);
      return <a className="product-card" key={product.slug} href={'/products/' + product.slug}>
        <img src={photo.src} srcSet={`${photo.src.replace('.webp', '-small.webp')} ${photo.smallWidth}w, ${photo.src} ${photo.width}w`} sizes="(max-width: 700px) 88vw, 30vw" alt={photo.alt} width={photo.width} height={photo.height} loading="lazy"/>
        <div className="product-card-body">
          <h2>{product.title}</h2>
          <p>{product.summary}</p>
          <span className="product-card-price">{low === high ? aud(low) : `${aud(low)} – ${aud(high)}`}</span>
        </div>
      </a>;
    })}</div>

    <section className="product-enquiry">
      <h2>Ordering for an event?</h2>
      <p>For a custom batch of ten or more pieces, tell us which design you want, how many you need and the date of your event.</p>
      <div className="portfolio-actions">
        <a className="primary" href="/enquiry?route=bulk">Get a bulk quote ↗</a>
        <a href="/pages/bonbonniere-custom">Bonbonniere &amp; keepsakes →</a>
      </div>
    </section>
  </article><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/></main>;
}
