import ImgixClient from 'imgix-core-js';
// @ts-ignore
import { IMGIX_DOMAIN, IMGIX_TOKEN } from 'react-native-dotenv';
import FastImage, { Source } from 'react-native-fast-image';

type MaybeImgixClient = ImgixClient | null;

export type signUriWithImgixParams = {
  readonly externalImageUri: string;
};

export type signUriWithImgixResult = string;

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
  const message = `[Imgix] Image signing is currently disabled! You can enable it by adding an IMGIX_DOMAIN and IMGIX_TOKEN to the .env. You can get these from https://www.imgix.com/.`;
  // It isn't suitable to release the application without Imgix support outside of development mode.
  if (!__DEV__) {
    throw new Error(message);
  }
  // eslint-disable-next-line no-console
  console.log(message);
}

// Determines if we're allowed to sign an image using Imgix.
// This is a placeholder function which can be extended to prevent
// unsupported urls from being signed.
export const canSignUriWithImgix = (
  params: signUriWithImgixParams
): boolean => {
  const { externalImageUri } = params;
  return typeof externalImageUri === 'string';
};

// Signs a url using Imgix.
// If Imgix environment variables are missing, the url will be
// returned unchanged.
export const signUriWithImgix = (
  params: signUriWithImgixParams
): signUriWithImgixResult => {
  const { externalImageUri } = params;
  if (canSignUriWithImgix(params)) {
    throw new Error(
      `[Imgix]: Attempted to sign "${externalImageUri}", but this is not supported.`
    );
  }
  if (imgixClient) {
    return imgixClient.buildURL(externalImageUri, {});
  }
  return externalImageUri;
};

export type MaybeExternalImageUris = readonly string[] | string;

// Safely pre-caches image urls using Imgix. This signs the source
// images so that we can ensure they're served via a trusted provider.
export const preload = (sources: readonly Source[]) => {
  return FastImage.preload(
    sources
      .filter(({ uri: externalImageUri }) => {
        if (typeof externalImageUri === 'string') {
          return canSignUriWithImgix({ externalImageUri });
        }
        return false;
      })
      .map(
        ({ uri: maybeUri, ...extras }): Source => {
          const externalImageUri = maybeUri as string;
          return {
            ...extras,
            uri: signUriWithImgix({ externalImageUri }),
          };
        }
      )
  );
};
