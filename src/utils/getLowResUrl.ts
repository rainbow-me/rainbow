import { PixelRatio } from 'react-native';
import { CardSize } from '../components/unique-token/CardSize';
import { imageToPng } from '@/handlers/imgix';

export const GOOGLE_USER_CONTENT_URL = 'https://lh3.googleusercontent.com/';

const getCDNUrl = (url: string, { w }: { w: number }) => {
  if (!url?.startsWith?.(GOOGLE_USER_CONTENT_URL)) return null;

  const splitUrl = url?.split('/');
  const urlTail = splitUrl[splitUrl.length - 1] || '';

  if (!urlTail.includes('=')) {
    // If the tail doesn't already include modifiers, we will add them.
    return `${url}=w${w}`;
  }
  if (urlTail.includes('=w')) {
    // If the tail includes a width modifier, we will modify it.
    return url.replace(/=w\d+/, `=w${w}`);
  }
  return null;
};

export const getLowResUrl = (
  url: string,
  lowResImageOptions?: { w: number }
) => {
  const w =
    lowResImageOptions?.w ??
    Math.floor((Math.ceil(CardSize) * PixelRatio.get()) / 3);

  const lowResUrl = imageToPng(url, w);
  const cdnUrl = getCDNUrl(url, { w });
  return cdnUrl || lowResUrl;
};
