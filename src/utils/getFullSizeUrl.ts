import { PixelRatio } from 'react-native';
import { maybeSignUri } from '@/handlers/imgix';
import { deviceUtils } from '@/utils';
import { CardSize } from '@/components/unique-token/CardSize';

export const GOOGLE_USER_CONTENT_URL = 'https://lh3.googleusercontent.com/';
const pixelRatio = PixelRatio.get();
const deviceWidth = deviceUtils.dimensions.width;
const fullSize = deviceWidth * pixelRatio;
const MAX_IMAGE_SCALE = 3;

export const FULL_NFT_IMAGE_SIZE = fullSize * MAX_IMAGE_SCALE;

export const getFullSizeUrl = ({
  url,
  res,
  convertToPng,
}: {
  url: string;
  res: 'high' | 'low';
  convertToPng: boolean;
}) => {
  const size =
    res === 'low'
      ? Math.floor((Math.ceil(CardSize) * PixelRatio.get()) / 3)
      : FULL_NFT_IMAGE_SIZE;
  if (url.startsWith(GOOGLE_USER_CONTENT_URL)) {
    return maybeSignUri(`${url.split('=')[0]}=w${size}`, {
      fm: convertToPng ? 'png' : undefined,
    });
  }
  return maybeSignUri(url, { w: size, fm: convertToPng ? 'png' : undefined });
};
