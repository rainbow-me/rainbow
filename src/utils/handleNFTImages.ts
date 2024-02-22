import { PixelRatio } from 'react-native';
import { maybeSignUri } from '@/handlers/imgix';
import { deviceUtils } from '@/utils';
import { CardSize } from '@/components/unique-token/CardSize';
import { GOOGLE_USER_CONTENT_URL } from './getFullResUrl';

const pixelRatio = PixelRatio.get();
const deviceWidth = deviceUtils.dimensions.width;
const fullSize = deviceWidth * pixelRatio;
const MAX_IMAGE_SCALE = 3;
export const FULL_NFT_IMAGE_SIZE = fullSize * MAX_IMAGE_SCALE;
const cardSize = Math.floor((Math.ceil(CardSize) * pixelRatio) / 3);

// mime types provided by SimpleHash
export enum MimeType {
  GIF = 'image/gif',
  SVG = 'image/svg+xml',
}

/**
 * Takes an NFT's original image and preview image (provided by SimpleHash) and
 * returns signed and potentially reformatted high-res and low-res URLs.
 */
export function handleNFTImages({
  originalUrl,
  previewUrl,
  mimeType,
}: {
  originalUrl: string | null | undefined;
  // previewUrl is provided by SimpleHash, expected to be jpeg, png, or gif
  previewUrl: string | null | undefined;
  mimeType: string | null | undefined;
}): { highResUrl: string | null; lowResUrl: string | null } {
  const url = previewUrl ?? originalUrl;
  if (!url) {
    return { highResUrl: null, lowResUrl: null };
  }

  const isSVG = mimeType === MimeType.SVG;
  const isGIF = mimeType === MimeType.GIF;
  const highResUrl =
    (isSVG
      ? // don't sign if SVG, will be handled by UniqueTokenImage component
        originalUrl
      : url?.startsWith?.(GOOGLE_USER_CONTENT_URL)
        ? url.replace(/=s\d+$/, `=s${FULL_NFT_IMAGE_SIZE}`)
        : maybeSignUri(url, {
            // decrease size for GIFs to avoid hitting imgix's 10MB limit
            w: isGIF ? cardSize : FULL_NFT_IMAGE_SIZE,
          })) ?? null;

  const lowResUrl =
    previewUrl?.startsWith?.(GOOGLE_USER_CONTENT_URL) && !isGIF
      ? previewUrl
      : maybeSignUri(url, {
          w: cardSize,
          // reformat to png in the case that the image may be an SVG or is a GIF
          fm: (!previewUrl && (!mimeType || isSVG)) || isGIF ? 'png' : undefined,
        }) ?? null;
  return { highResUrl, lowResUrl };
}
