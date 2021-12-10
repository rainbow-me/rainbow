import { PixelRatio } from 'react-native';
import { CardSize } from '../components/unique-token/CardSize';

export const GOOGLE_USER_CONTENT_URL = 'https://lh3.googleusercontent.com/';
const size = Math.ceil(CardSize) * PixelRatio.get();

export const getLowResUrl = (url: string) => {
  if (url?.startsWith?.(GOOGLE_USER_CONTENT_URL)) {
    return `${url}?w=${size}`;
  }
  return url;
};
