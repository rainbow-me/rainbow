import { PixelRatio } from 'react-native';
import { maybeSignUri } from '@rainbow-me/handlers/imgix';
import { deviceUtils } from '@rainbow-me/utils';

export const GOOGLE_USER_CONTENT_URL = 'https://lh3.googleusercontent.com/';
const pixelRatio = PixelRatio.get();
const deviceWidth = deviceUtils.dimensions.width;
const size = deviceWidth * pixelRatio;
const MAX_IMAGE_SCALE = 3;

export const getFullSizeUrl = (url: string) => {
  if (url?.startsWith?.(GOOGLE_USER_CONTENT_URL)) {
    return `${url}=w${size * MAX_IMAGE_SCALE}`;
  }
  return maybeSignUri(url, { w: size * MAX_IMAGE_SCALE });
};
