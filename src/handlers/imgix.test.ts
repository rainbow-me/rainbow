import { withRemoteConfig } from '@/features/config/testing/mockRemoteConfig';

import { getSizedImageUrl, maybeSignSource, maybeSignUri, staticSignatureLRU, withImageHost } from './imgix';

jest.mock('@/features/config/stores/remoteConfig');

jest.mock('react-native-dotenv', () => ({
  IMGIX_DOMAIN: 'rainbow.imgix.net',
  IMGIX_TOKEN: 'test-secure-url-token',
}));

jest.mock('react-native', () => ({
  PixelRatio: { getPixelSizeForLayoutSize: (n: number) => Math.round(n * 3) },
}));

// imgix-core-js is patched to sign via react-native-quick-md5, a native module.
// Substitute a real md5 so the signatures below are the genuine ones.
jest.mock('react-native-quick-md5', () => ({
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  stringMd5: (value: string) => require('crypto').createHash('md5').update(value).digest('hex'),
}));

jest.mock('@/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
  RainbowError: class extends Error {},
}));

beforeEach(() => {
  staticSignatureLRU.clear();
});

// The LRU keys off the options as passed, before the pixel ratio is applied.
const cacheKey = (uri: string, w?: number, fm?: string) => `${uri}-${w}-${fm}`;

describe('maybeSignUri', () => {
  it('encodes the source URL into the path and signs it', () => {
    expect(maybeSignUri('https://rainbowme-res.cloudinary.com/image/upload/assets/ethereum/aaa.png', { w: 40, h: 40 })).toBe(
      'https://rainbow.imgix.net/https%3A%2F%2Frainbowme-res.cloudinary.com%2Fimage%2Fupload%2Fassets%2Fethereum%2Faaa.png?w=120&h=120&s=340790d5bf71bf74ebd36e990ce81585'
    );
  });

  it('multiplies w and h by the device pixel ratio (40 becomes 120 at 3x)', () => {
    expect(maybeSignUri('https://example.com/dpr.png', { w: 40, h: 40 })).toBe(
      'https://rainbow.imgix.net/https%3A%2F%2Fexample.com%2Fdpr.png?w=120&h=120&s=e42b7668f687e1280ee04ad6c37a7cd8'
    );
  });

  it('emits w only when h is absent', () => {
    expect(maybeSignUri('https://example.com/w-only.png', { w: 200 })).toBe(
      'https://rainbow.imgix.net/https%3A%2F%2Fexample.com%2Fw-only.png?w=600&s=486799e9c247ac8d57bfb1930780f076'
    );
  });

  it('passes fm through unscaled', () => {
    expect(maybeSignUri('https://example.com/fm.svg', { w: 40, fm: 'png' })).toBe(
      'https://rainbow.imgix.net/https%3A%2F%2Fexample.com%2Ffm.svg?w=120&fm=png&s=f1222d02fcfe4658c572f40ba95d2eb5'
    );
  });

  it('signs with no transform params when none are given', () => {
    expect(maybeSignUri('https://example.com/bare.png', {})).toBe(
      'https://rainbow.imgix.net/https%3A%2F%2Fexample.com%2Fbare.png?s=6b766934e1361d82327a9472cda2acb4'
    );
  });

  it('always emits w, h, fm in that order whatever order the caller passed', () => {
    expect(maybeSignUri('https://example.com/order.png', { fm: 'png', h: 40, w: 40 })).toBe(
      'https://rainbow.imgix.net/https%3A%2F%2Fexample.com%2Forder.png?w=120&h=120&fm=png&s=293d552080893249651b1247735efb59'
    );
  });

  it('returns URLs with no host untouched', () => {
    expect(maybeSignUri('not-a-url')).toBe('not-a-url');
  });

  it('returns undefined input untouched', () => {
    expect(maybeSignUri(undefined)).toBeUndefined();
  });

  it('caches the signed URL under the pre-scaling (uri, w, fm)', () => {
    const source = 'https://example.com/cached.png';
    const signed = maybeSignUri(source, { w: 40, h: 40 });
    expect(staticSignatureLRU.get(cacheKey(source, 40))).toBe(signed);
  });

  it('returns a cached entry rather than re-signing', () => {
    const source = 'https://example.com/preseeded.png';
    staticSignatureLRU.set(cacheKey(source, 40), 'cached-sentinel');
    expect(maybeSignUri(source, { w: 40 })).toBe('cached-sentinel');
  });

  it('keys fm separately, so one uri and width can hold two formats', () => {
    const source = 'https://example.com/two-formats.svg';
    const png = maybeSignUri(source, { w: 40, fm: 'png' });

    expect(maybeSignUri(source, { w: 40, fm: 'gif' })).not.toBe(png);
    expect(maybeSignUri(source, { w: 40, fm: 'png' })).toBe(png);
  });

  it('skipCaching ignores a cached entry and re-signs', () => {
    const source = 'https://example.com/skip.png';
    staticSignatureLRU.set(cacheKey(source, 40), 'cached-sentinel');
    expect(maybeSignUri(source, { w: 40 }, true)).toBe(
      'https://rainbow.imgix.net/https%3A%2F%2Fexample.com%2Fskip.png?w=120&s=4a6292056d91627774dde3f9c77442ef'
    );
  });
});

describe('getSizedImageUrl', () => {
  it('signs a square w/h from a single size, emitted in w,h order', () => {
    expect(getSizedImageUrl('https://example.com/sized.png', 80)).toBe(
      'https://rainbow.imgix.net/https%3A%2F%2Fexample.com%2Fsized.png?w=240&h=240&s=8838a788cb1e632090456b05369d0dda'
    );
  });

  it('returns undefined for a missing url', () => {
    expect(getSizedImageUrl(null)).toBeUndefined();
  });
});

describe('maybeSignSource', () => {
  it('signs the uri and preserves other source fields', () => {
    expect(maybeSignSource({ uri: 'https://example.com/source.png', headers: { a: 'b' } }, { w: 40 })).toEqual({
      headers: { a: 'b' },
      uri: 'https://rainbow.imgix.net/https%3A%2F%2Fexample.com%2Fsource.png?w=120&s=5e0397bc0858d369116917aa7c173977',
    });
  });
});

describe('withImageHost', () => {
  const signed = 'https://rainbow.imgix.net/https%3A%2F%2Fexample.com%2Fa.png?w=120&s=abc123';

  it('leaves the URL on imgix while the flag is off', () => {
    withRemoteConfig({ image_cdn_enabled: false }, () => {
      expect(withImageHost(signed)).toBe(signed);
    });
  });

  it('swaps only the host when the flag is on, leaving path, query and signature intact', () => {
    withRemoteConfig({ image_cdn_enabled: true }, () => {
      expect(withImageHost(signed)).toBe('https://img.p.rainbow.me/https%3A%2F%2Fexample.com%2Fa.png?w=120&s=abc123');
    });
  });

  it('ignores URLs it did not mint', () => {
    withRemoteConfig({ image_cdn_enabled: true }, () => {
      expect(withImageHost('https://example.com/a.png')).toBe('https://example.com/a.png');
      expect(withImageHost(undefined)).toBeUndefined();
    });
  });

  it('rewrites on the way out of the cache, so a flip needs no cache invalidation', () => {
    const source = 'https://example.com/flip.png';
    const beforeFlip = maybeSignUri(source, { w: 40 });
    expect(beforeFlip).toContain('https://rainbow.imgix.net/');

    withRemoteConfig({ image_cdn_enabled: true }, () => {
      expect(maybeSignUri(source, { w: 40 })).toBe(beforeFlip?.replace('https://rainbow.imgix.net/', 'https://img.p.rainbow.me/'));
    });
  });

  it('restores the previous value after the block, without an afterEach', () => {
    withRemoteConfig({ image_cdn_enabled: true }, () => undefined);
    expect(withImageHost(signed)).toBe(signed);
  });
});
