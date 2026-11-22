// Norwegian bookstores (Norli / Ark). They have no public catalogue API, so
// "add via Norli/Ark" works by searching the book by ISBN/title in the app
// and opening the shop's own search page. Adjust the URL patterns here if the
// shops change their sites.
export const STORES = [
  { key: 'norli', name: 'Norli', searchUrl: (q: string) => `https://www.norli.no/search?q=${encodeURIComponent(q)}` },
  { key: 'ark', name: 'Ark', searchUrl: (q: string) => `https://www.ark.no/sok?q=${encodeURIComponent(q)}` },
] as const;
