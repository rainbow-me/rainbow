import ImgixClient from 'imgix-core-js';
// @ts-ignore
import { IMGIX_DOMAIN, IMGIX_TOKEN } from 'react-native-dotenv';
import FastImage, { Source } from 'react-native-fast-image';
import parse from 'url-parse';

type MaybeImgixClient = ImgixClient | null;

export type signUriWithImgixParams = string;
export type signUriWithImgixResult = string;

type SignedImageResultCache = {
  readonly [originalUrl: string]: string;
};

// Here we latch onto previously signed values to avoid repeatedly
// generating equivalent signed URLs to improve performance.
// NOTE: This cache is currently unbounded and can grow forever.
//       it might be suitable to use something like mnemonist/lru
//       to cap the maximum size.
const staticResultCache = {} as SignedImageResultCache;

const maybeAlreadySignedUri = (externalImageUri: string): string | null => {
  const maybeSignedUri = staticResultCache[externalImageUri];
  if (typeof maybeSignedUri === 'string') {
    return maybeSignedUri;
  }
  return null;
};

const maybeCreateImgixClient = (): MaybeImgixClient => {
  const hasImgixDomain =
    typeof IMGIX_DOMAIN === 'string' && !!IMGIX_DOMAIN.length;
  const hasImgixToken = typeof IMGIX_TOKEN === 'string' && !!IMGIX_TOKEN.length;
  if (hasImgixDomain && hasImgixToken) {
    return new ImgixClient({
      domain: IMGIX_DOMAIN,
      includeLibraryParam: false,
      secureURLToken: IMGIX_TOKEN,
    });
  }
  return null;
};

const imgixClient = maybeCreateImgixClient();

if (!imgixClient) {
  __DEV__ &&
    // eslint-disable-next-line no-console
    console.log(
      `[Imgix] Image signing is currently disabled! You can enable it by adding an IMGIX_DOMAIN and IMGIX_TOKEN to the .env. You can get these from https://www.imgix.com/.`
    );
}

// Determines if we're allowed to sign an image using Imgix.
// This is a placeholder function which can be extended to prevent
// unsupported urls from being signed.
// TODO: This **needs** to avoid local images.
export const canSignUriWithImgix = (
  externalImageUri: signUriWithImgixParams
): boolean => {
  if (typeof externalImageUri === 'string') {
    try {
      // Determine whether this is a suitable source.
      const { host } = parse(externalImageUri);
      return typeof host === 'string' && !!host.length;
    } catch (e) {
      return false;
    }
  }
  return false;
};

// Signs a url using Imgix.
// If Imgix environment variables are missing, the url will be
// returned unchanged.
export const signUriWithImgix = (
  externalImageUri: signUriWithImgixParams
): signUriWithImgixResult => {
  // Short circuit. (Perf +)
  const alreadySignedUri = maybeAlreadySignedUri(externalImageUri);
  if (alreadySignedUri) {
    return alreadySignedUri;
  } else if (!canSignUriWithImgix(externalImageUri)) {
    throw new Error(
      `[Imgix]: Attempted to sign "${externalImageUri}", but this is not supported.`
    );
  }
  if (imgixClient) {
    const signedImageUri = imgixClient.buildURL(externalImageUri, {});
    // To improve performance, we latched signed image URLs to prevent
    // further signature attempts for a successfully signed URL.
    if (signedImageUri) {
      // @ts-ignore
      staticResultCache[externalImageUri] = signedImageUri;
    }
  }
  return externalImageUri;
};

export type MaybeExternalImageUris = readonly string[] | string;

export const signImageSource = (source: Source): Source => {
  const { uri: maybeStringUri, ...extras } = source;
  if (typeof maybeStringUri !== 'string') {
    return source;
  }
  const externalImageUri = maybeStringUri as string;
  // Short circuit. (Perf +)
  const alreadySignedUri = maybeAlreadySignedUri(externalImageUri);
  if (alreadySignedUri) {
    return {
      ...extras,
      uri: alreadySignedUri,
    };
  } else if (!canSignUriWithImgix(externalImageUri)) {
    return source;
  }
  return {
    ...extras,
    uri: signUriWithImgix(externalImageUri),
  };
};

// Helper function to permit callers to sign an image inline.
export const maybeSignUri = (uri: string) => {
  return maybeAlreadySignedUri(uri) || canSignUriWithImgix(uri)
    ? signUriWithImgix(uri)
    : uri;
};

// Safely pre-caches image urls using Imgix. This signs the source
// images so that we can ensure they're served via a trusted provider.
export const preload = (sources: readonly Source[]): void => {
  return FastImage.preload(
    sources
      .filter(({ uri: externalImageUri }) => {
        if (typeof externalImageUri === 'string') {
          return canSignUriWithImgix(externalImageUri);
        }
        return false;
      })
      .map((source): Source => signImageSource(source))
  );
};
