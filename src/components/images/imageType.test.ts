import { getImageType } from './imageType';

jest.mock('react-native-dotenv', () => ({ IMGIX_DOMAIN: 'rainbow.imgix.net' }));

const encoded = (source: string) => encodeURIComponent(source);

describe('getImageType', () => {
  describe.each([
    ['imgix', 'https://rainbow.imgix.net'],
    ['our own CDN', 'https://img.p.rainbow.me'],
  ])('for images on %s', (_label, origin) => {
    it('reads the format out of fm=', () => {
      expect(getImageType(`${origin}/${encoded('https://example.com/a.svg')}?w=120&fm=png`)).toBe('png');
    });

    it('reads a non-png fm', () => {
      expect(getImageType(`${origin}/${encoded('https://example.com/b.png')}?w=120&fm=gif`)).toBe('gif');
    });

    it('assumes png when fm is absent, whatever the source extension is', () => {
      // The path is an encoded source URL, so its extension describes the source
      // rather than the response. Without fm there is nothing else to go on.
      expect(getImageType(`${origin}/${encoded('https://example.com/c.svg')}?w=120`)).toBe('png');
      expect(getImageType(`${origin}/${encoded('https://example.com/d.jpg')}?w=120`)).toBe('png');
    });

    it('returns unknown for an fm we cannot decode', () => {
      expect(getImageType(`${origin}/${encoded('https://example.com/e.png')}?w=120&fm=tiff`)).toBe('unknown');
    });
  });

  describe('for every other host, sniffed from the file extension', () => {
    it.each([
      ['https://example.com/a.png', 'png'],
      ['https://example.com/a.jpg', 'jpg'],
      ['https://example.com/a.jpeg', 'jpeg'],
      ['https://example.com/a.webp', 'webp'],
      ['https://example.com/a.gif', 'gif'],
      ['https://example.com/a.avif', 'avif'],
      ['https://example.com/a.bmp', 'bmp'],
      ['https://example.com/a.svg', 'unknown'],
      ['https://example.com/no-extension', 'unknown'],
    ])('%s -> %s', (url, expected) => {
      expect(getImageType(url)).toBe(expected);
    });

    it('ignores the query string when sniffing the extension', () => {
      expect(getImageType('https://example.com/a.png?w=120')).toBe('png');
    });

    it('includes hosts that merely look like ours, since the match is exact', () => {
      expect(getImageType(`https://notimgix.net/${encoded('https://example.com/h.svg')}?w=120&fm=png`)).toBe('unknown');
      expect(getImageType(`https://imgix.net.attacker.com/${encoded('https://x.com/i.svg')}?fm=png`)).toBe('unknown');
    });
  });

  it('returns unknown for input that is not a URL', () => {
    expect(getImageType('not-a-url')).toBe('unknown');
  });
});
