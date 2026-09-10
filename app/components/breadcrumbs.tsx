import { SITE_URL } from '../../lib/site';

type Crumb = { name: string; path: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const trail = [{ name: 'Home', path: '/' }, ...items];
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.name, item: SITE_URL + item.path,
    })),
  };
  return <>
    <nav className="breadcrumbs" aria-label="Breadcrumb"><ol>{trail.map((item, index) =>
      <li key={item.path}>{index === trail.length - 1
        ? <span aria-current="page">{item.name}</span>
        : <a href={item.path}>{item.name}</a>}</li>
    )}</ol></nav>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/>
  </>;
}
