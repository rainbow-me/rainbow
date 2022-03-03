import ImgixClient from 'imgix-core-js';
import LRUCache from 'mnemonist/lru-cache';
import { PixelRatio } from 'react-native';
import {
  // @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
  IMGIX_DOMAIN as domain,
  // @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
  IMGIX_TOKEN as secureURLToken,
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
  logger.log(
    '[Imgix] Image signing disabled. Please ensure you have specified both IMGIX_DOMAIN and IMGIX_TOKEN inside your .env.'
  );
  return null;
};

const staticImgixClient = shouldCreateImgixClient();

// Below, we use a static buffer to prevent multiple successive signing attempts
// for components which may have been unmounted/remounted. This is done to
// increase performance.

// TODO: We need to find a suitable upper limit.
//       This might be conditional based upon either the runtime
//       hardware or the number of unique tokens a user may have.
const capacity = 512;
export const staticSignatureLRU = new LRUCache<string, string>(capacity);

interface ImgOptions {
  w?: number;
  h?: number;
  fm?: string;
}

const shouldSignUri = (
  externalImageUri: string,
  options?: ImgOptions
): string | undefined => {
  try {
    // We'll only attempt to sign if there's an available client. A client
    // will not exist if the .env hasn't been configured correctly.
    if (staticImgixClient) {
      // Attempt to sign the image.
      let updatedOptions: ImgOptions = {};
      if (options?.w && options?.h) {
        updatedOptions = {
          h: PixelRatio.getPixelSizeForLayoutSize(options.h),
          w: PixelRatio.getPixelSizeForLayoutSize(options.w),
        };
      }
      if (options?.fm) {
        updatedOptions.fm = options.fm;
      }
      const signedExternalImageUri = staticImgixClient.buildURL(
        externalImageUri,
        updatedOptions
      );

      // Check that the URL was signed as expected.
      if (typeof signedExternalImageUri === 'string') {
        // Buffer the signature into the LRU for future use.
        const signature = `${externalImageUri}-${options?.w}`;
        !staticSignatureLRU.has(signature) &&
          staticSignatureLRU.set(signature, signedExternalImageUri);
        // Return the signed image.
        return signedExternalImageUri;
      }
      throw new Error(
        `Expected string signedExternalImageUri, encountered ${typeof signedExternalImageUri} (for input "${externalImageUri}").`
      );
    }
  } catch (e: any) {
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
const isPossibleToSignUri = (externalImageUri: string | undefined): boolean => {
  if (typeof externalImageUri === 'string' && !!externalImageUri.length) {
    try {
      const { host } = parse(externalImageUri);
      return typeof host === 'string' && !!host.length;
    } catch (e: any) {
      logger.log(
        `[Imgix]: Failed to parse "${externalImageUri}"! (${e.message})`
      );
      return false;
    }
  }
  return false;
};

export const maybeSignUri = (
  externalImageUri: string | undefined,
  options?: ImgOptions,
  skipCaching: boolean = false
): string | undefined => {
  // If the image has already been signed, return this quickly.
  const signature = `${externalImageUri}-${options?.w}`;
  if (
    typeof externalImageUri === 'string' &&
    staticSignatureLRU.has(signature as string) &&
    !skipCaching
  ) {
    return staticSignatureLRU.get(signature);
  }
  if (
    typeof externalImageUri === 'string' &&
    !!externalImageUri.length &&
    isPossibleToSignUri(externalImageUri)
  ) {
    return shouldSignUri(externalImageUri, options);
  }
  return externalImageUri;
};

export const maybeSignSource = (source: Source, options?: {}): Source => {
  if (!!source && typeof source === 'object') {
    const { uri: externalImageUri, ...extras } = source;
    return {
      ...extras,
      uri: maybeSignUri(externalImageUri, options),
    };
  }
  return source;
};

export const imageToPng = (url: string, w: number) => {
  return maybeSignUri(url, { w });
};
