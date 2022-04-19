import { PixelRatio } from 'react-native';
import { CardSize } from '../components/unique-token/CardSize';
import { imageToPng } from '@rainbow-me/handlers/imgix';

export const GOOGLE_USER_CONTENT_URL = 'https://lh3.googleusercontent.com/';
const size = Math.floor((Math.ceil(CardSize) * PixelRatio.get()) / 5);

export const getLowResUrl = (url: string) => {
  const splitUrl = url?.split('/');
  const urlTail = splitUrl[splitUrl.length - 1] || '';

  // Check if it is from the given CDN. If it is, also check if the url does not already
  // contain a modifier (e.g. `...=s128`)
  if (url?.startsWith?.(GOOGLE_USER_CONTENT_URL) && !urlTail.includes('=')) {
    return `${url}=w${size}`;
  }
  return imageToPng(url, size);
};
