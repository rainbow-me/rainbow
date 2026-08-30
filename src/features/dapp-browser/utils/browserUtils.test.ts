import { normalizeUrlWorklet } from './browserUtils';

jest.mock('../constants/constants', () => ({
  APP_STORE_URL_PREFIXES: [],
  RAINBOW_HOME: 'RAINBOW_HOME',
}));

describe('normalizeUrlWorklet', () => {
  it.each<[string | undefined, string | undefined]>([
    [undefined, undefined],
    ['', undefined],
    ['RAINBOW_HOME', 'RAINBOW_HOME'],
    ['https://example.com', 'https://example.com'],
    ['https://example.com/market', 'https://example.com/market'],
    ['https://example.com/market#offers', 'https://example.com/market#offers'],
    ['app.uniswap.org', 'https://app.uniswap.org'],
    ['example.com:3000', 'https://example.com:3000'],
    ['http://localhost:3000', 'http://localhost:3000'],
  ])('normalizes %p to %p', (url, expected) => {
    expect(normalizeUrlWorklet(url)).toBe(expected);
  });

  it.each(['blob:https://example.com/id', 'data:text/plain,hello', 'file:///tmp/file', 'file:123', 'rainbow://wallet', 'rainbow:123'])(
    'rejects %p',
    url => {
      expect(normalizeUrlWorklet(url)).toBeUndefined();
    }
  );
});
