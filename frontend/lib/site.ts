const DEFAULT_SITE_URL = 'http://localhost:3000';

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    DEFAULT_SITE_URL
  ).replace(/\/+$/, '');
}

export function absoluteUrl(path: string): string {
  return `${getSiteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}
