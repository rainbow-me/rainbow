import { PixelRatio } from 'react-native';
import { maybeSignUri } from '@/handlers/imgix';
import { deviceUtils } from '@/utils';

export const GOOGLE_USER_CONTENT_URL = 'https://lh3.googleusercontent.com/';
const pixelRatio = PixelRatio.get();
const deviceWidth = deviceUtils.dimensions.width;
const size = deviceWidth * pixelRatio;
const MAX_IMAGE_SCALE = 3;

export const FULL_NFT_IMAGE_SIZE = size * MAX_IMAGE_SCALE;

export const getFullSizeUrl = (url: string) => {
  if (url?.startsWith?.(GOOGLE_USER_CONTENT_URL)) {
    return `${url}=w${FULL_NFT_IMAGE_SIZE}`;
  }
  return maybeSignUri(url, { w: FULL_NFT_IMAGE_SIZE });
};
