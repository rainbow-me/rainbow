import ImgixClient from 'imgix-core-js';
import {
  IMGIX_DOMAIN as domain,
  IMGIX_TOKEN as secureURLToken,
  // @ts-ignore
} from 'react-native-dotenv';
import { Source } from 'react-native-fast-image';
import parse from 'url-parse';
import logger from 'logger';

const shouldCreateImgixClient = (): ImgixClient | null => {
  if (
    typeof domain === 'string' &&
    !!domain.length &&
    typeof secureURLToken === 'string' &&
    !!secureURLToken.length
  ) {
    return new ImgixClient({
      domain,
      includeLibraryParam: false,
      secureURLToken,
    });
  }
  // eslint-disable-next-line no-console
  console.log(
    '[Imgix] Image signing disabled. Please ensure you have specified both IMGIX_DOMAIN and IMGIX_TOKEN inside your .env.'
  );
  return null;
};

const staticImgixClient = shouldCreateImgixClient();

// Here we use a static buffer to prevent multiple successive signing attempts
// for components which may have been unmounted/remounted. This is done to
// increase performance. It's important to recognize that this cache is
// **unbounded** and will grow **forever**, so we should probably opt to use
// an LRU to cap memory. https://yomguithereal.github.io/mnemonist/lru-cache.html
const staticSignatureCache = {} as {
  [externalImageUri: string]: string;
};

const shouldSignUri = (externalImageUri: string): string | undefined => {
  try {
    // We'll only attempt to sign if there's an available client. A client
    // will not exist if the .env hasn't been configured correctly.
    if (staticImgixClient) {
      // Attempt to sign the image.
      const signedExternalImageUri = staticImgixClient.buildURL(
        externalImageUri,
        {}
      );
      // Check that the URL was signed as expected.
      if (typeof signedExternalImageUri === 'string') {
        // Buffer the signature for future use.
        staticSignatureCache[externalImageUri] = signedExternalImageUri;
        // Return the signed image.
        return signedExternalImageUri;
      }
      throw new Error(
        `Expected string signedExternalImageUri, encountered ${typeof signedExternalImageUri} (for input "${externalImageUri}").`
      );
    }
  } catch (e) {
    logger.log(`[Imgix]: Failed to sign "${externalImageUri}"! (${e.message})`);
    // If something goes wrong, it is not safe to assume the image is valid.
    return undefined;
  }
  return externalImageUri;
};

// Determines whether an externalImageUri should be signed.
// It should be a non-empty string which points to a remote address.
// Other strings (such as those which point to local assets) should
// not be signed.
export const isPossibleToSignUri = (
  externalImageUri: string | undefined
): boolean => {
  if (typeof externalImageUri === 'string' && !!externalImageUri.length) {
    try {
      const { host } = parse(externalImageUri);
      return typeof host === 'string' && !!host.length;
    } catch (e) {
      logger.log(
        `[Imgix]: Failed to parse "${externalImageUri}"! (${e.message})`
      );
      return false;
    }
  }
  return false;
};

export const maybeSignUri = (
  externalImageUri: string | undefined
): string | undefined => {
  if (typeof externalImageUri === 'string') {
    const maybeAlreadySigned = staticSignatureCache[externalImageUri as string];
    if (maybeAlreadySigned) {
      return maybeAlreadySigned;
    }
  }
  if (
    typeof externalImageUri === 'string' &&
    !!externalImageUri.length &&
    isPossibleToSignUri(externalImageUri)
  ) {
    return shouldSignUri(externalImageUri);
  }
  return externalImageUri;
};

export const maybeSignSource = (source: Source): Source => {
  if (!!source && typeof source === 'object') {
    const { uri: externalImageUri, ...extras } = source;
    return {
      ...extras,
      uri: maybeSignUri(externalImageUri),
    };
  }
  return source;
};
