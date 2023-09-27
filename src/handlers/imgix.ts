import ImgixClient from 'imgix-core-js';
import LRUCache from 'mnemonist/lru-cache';
import { PixelRatio } from 'react-native';
import {
  IMGIX_DOMAIN as domain,
  IMGIX_TOKEN as secureURLToken,
} from 'react-native-dotenv';
import { Source } from 'react-native-fast-image';
import parse from 'url-parse';
import {
  isCloudinaryStorageIconLink,
  signCloudinaryIconUrl,
} from '@/handlers/cloudinary';
import { logger, RainbowError } from '@/logger';

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
  logger.error(
    new RainbowError(
      '[Imgix] Image signing disabled. Please ensure you have specified both IMGIX_DOMAIN and IMGIX_TOKEN inside your .env.'
    )
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
const capacity = 1024;
export let staticSignatureLRU: LRUCache<string, string> = new LRUCache(
  capacity
);

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
    const updatedOptions: ImgOptions = {};
    if (options?.w) {
      updatedOptions.w = PixelRatio.getPixelSizeForLayoutSize(options.w);
    }
    if (options?.h) {
      updatedOptions.h = PixelRatio.getPixelSizeForLayoutSize(options.h);
    }

    if (options?.fm) {
      updatedOptions.fm = options.fm;
    }

    // Firstly, we check if the url is a Cloudinary link.
    // Then, obviously, we use Cloudinary to transform the size and format.
    if (isCloudinaryStorageIconLink(externalImageUri)) {
      const signedExternalImageUri = signCloudinaryIconUrl(externalImageUri, {
        format: updatedOptions.fm,
        height: updatedOptions.h,
        width: updatedOptions.w,
      });
      const signature = `${externalImageUri}-${options?.w}-${options?.fm}`;
      staticSignatureLRU.set(signature, signedExternalImageUri);
      return signedExternalImageUri;
    }

    // We'll only attempt to sign if there's an available client. A client
    // will not exist if the .env hasn't been configured correctly.
    if (staticImgixClient) {
      // Attempt to sign the image.

      const signedExternalImageUri = staticImgixClient.buildURL(
        externalImageUri,
        updatedOptions
      );

      // Check that the URL was signed as expected.
      if (typeof signedExternalImageUri === 'string') {
        // Buffer the signature into the LRU for future use.
        const signature = `${externalImageUri}-${options?.w}-${options?.fm}`;
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
    logger.error(new RainbowError(`[Imgix]: Failed to sign`), {
      externalImageUri,
      message: e.message,
    });
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
      logger.error(new RainbowError(`[Imgix]: Failed to parse`), {
        externalImageUri,
        message: e.message,
      });
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
  const signature = `${externalImageUri}-${options?.w}-${options?.fm}`;
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

export const maybeSignSource = (
  source: Source,
  options?: Record<string, unknown>
): Source => {
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
  return maybeSignUri(url, { fm: 'png', w });
};
