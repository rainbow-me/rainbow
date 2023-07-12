import { PixelRatio } from 'react-native';
import { CardSize } from '../components/unique-token/CardSize';
import { imageToPng, maybeSignUri } from '@/handlers/imgix';

export const GOOGLE_USER_CONTENT_URL = 'https://lh3.googleusercontent.com/';

export const getCDNUrl = (url: string, size: number) => {
  if (!url.startsWith(GOOGLE_USER_CONTENT_URL)) return null;
  return `${url.split('=')[0]}=w${size}`;
};

export const getLowResUrl2 = ({
  url,
  size,
  convertToPng,
}: {
  url: string;
  size?: number;
  convertToPng?: boolean;
}) => {
  const w = size ?? Math.floor((Math.ceil(CardSize) * PixelRatio.get()) / 3);

  return maybeSignUri(getCDNUrl(url, w) ?? url, {
    w: w,
    fm: convertToPng ? 'png' : undefined,
  });
};

export const getLowResUrl = (
  url: string,
  lowResImageOptions?: { w: number }
) => {
  const w =
    lowResImageOptions?.w ??
    Math.floor((Math.ceil(CardSize) * PixelRatio.get()) / 3);

  const lowResUrl = imageToPng(url, w);
  const cdnUrl = getCDNUrl(url, w);
  return cdnUrl || lowResUrl;
};
