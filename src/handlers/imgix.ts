import ImgixClient from 'imgix-core-js';
// @ts-ignore
import { IMGIX_DOMAIN, IMGIX_TOKEN } from 'react-native-dotenv';

type MaybeImgixClient = ImgixClient | null;

export type signUrlWithImgixParams = {
  readonly externalImageUri: string;
};

export type signUrlWithImgixResult = string;

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

// Signs a url using Imgix.
// If Imgix environment variables are missing, the url will be
// returned unchanged.
export const signUrlWithImgix = ({
  externalImageUri,
}: signUrlWithImgixParams): signUrlWithImgixResult => {
  if (imgixClient) {
    return imgixClient.buildURL(externalImageUri, {});
  }
  return externalImageUri;
};
