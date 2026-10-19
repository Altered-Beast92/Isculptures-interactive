import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

// Builds an article's contents list from its own <h2>s, so the list can't
// drift from the headings. Guide bodies (app/guides/posts/*) are plain function
// components that return a fragment of top-level elements, with no hooks, so
// calling one directly yields its element tree. Each top-level <h2> gets an
// id for the contents links to jump to. Headings nested inside other
// elements are not collected, so keep section headings at the top level.

export type TocEntry = { id: string; text: string };

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement(node)) {
    return textOf((node.props as { children?: ReactNode }).children);
  }
  return '';
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function withHeadingIds(Body: () => ReactElement) {
  const tree = Body();
  const toc: TocEntry[] = [];
  const used = new Set<string>();

  const children = Children.map(
    (tree.props as { children?: ReactNode }).children,
    (child) => {
      if (!isValidElement(child) || child.type !== 'h2') return child;
      const text = textOf((child.props as { children?: ReactNode }).children)
        .replace(/\s+/g, ' ')
        .trim();
      let id = slugify(text) || 'section';
      for (let n = 2; used.has(id); n++) id = `${slugify(text)}-${n}`;
      used.add(id);
      toc.push({ id, text });
      return cloneElement(child as ReactElement<{ id?: string }>, { id });
    }
  );

  return { content: <>{children}</>, toc, text: textOf(tree) };
}
