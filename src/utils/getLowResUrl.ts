import { PixelRatio } from 'react-native';
import { CardSize } from '../components/unique-token/CardSize';
import { imageToPng } from '@rainbow-me/handlers/imgix';

export const GOOGLE_USER_CONTENT_URL = 'https://lh3.googleusercontent.com/';
const size = Math.floor((Math.ceil(CardSize) * PixelRatio.get()) / 3);

export const getLowResUrl = (url: string) => {
  if (url?.startsWith?.(GOOGLE_USER_CONTENT_URL)) {
    return `${url}=w${size}`;
  }
  return imageToPng(url, size);
};
