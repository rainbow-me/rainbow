/**
 * Reduces a URL to what is safe to log. Our request URLs carry user data as a matter of ordinary
 * REST design, and a URL is the one part of a request that gets logged by default, everywhere: the
 * SDK attaches a breadcrumb per request to every event it sends.
 *
 *   platform.p.rainbow.me/v1/rewards/GetAirdropBalance   ->  unchanged; route words carry no values
 *   api.example.com/v1/sessions/aB3dE5gH...oQ2sU4w       ->  api.example.com/v1/sessions/:id
 *   platform.p.rainbow.me/v1/transactions/0x88df...944b  ->  platform.p.rainbow.me/v1/transactions/:id
 *   token-search.p.rainbow.me/v3/discovery/1,10,8453     ->  token-search.p.rainbow.me/v3/discovery/:id
 *   api.rainbow.me/v1/ens/vitalik.eth                    ->  api.rainbow.me/v1/ens/:id
 *   aha.rainbow.me/?address=0x7a25...488d                ->  aha.rainbow.me
 *   arc-graphql.rainbow.me/graphql?query=%7B...%7D       ->  arc-graphql.rainbow.me/graphql
 *   anything unparseable, including a bare host          ->  undefined, and the caller drops the field
 */

const KEEPABLE_SEGMENT = [
  /^v\d{1,3}$/i, // api version: v1, v3
  /^[A-Za-z][A-Za-z_-]{0,39}$/, // route word, no digits and no dot: rewards, GetAirdropBalance, token-price
];

/** Returns the sanitized URL or `undefined` if the URL could not be sanitized */
export function sanitizeUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    // Fail closed, as everywhere else here: `data:`, `ipfs:`, `file:` and app schemes report their
    // origin as the string `"null"` and their whole payload as the path, so nothing here is safe to
    // keep. Only request URLs reach this function, so anything without an origin is anomalous input.
    if (!parsed.origin || parsed.origin === 'null') return undefined;

    return `${parsed.origin}${templatePath(parsed.pathname)}`;
  } catch {
    return undefined;
  }
}

function templatePath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return '';

  // An allowlist rather than a denylist, so a segment we do not recognise fails closed to `:id`.
  return `/${segments.map(segment => (KEEPABLE_SEGMENT.some(pattern => pattern.test(segment)) ? segment : ':id')).join('/')}`;
}
