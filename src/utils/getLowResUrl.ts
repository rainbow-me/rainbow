import { PixelRatio } from 'react-native';
import { CardSize } from '../components/unique-token/CardSize';
import { imageToPng } from '@rainbow-me/handlers/imgix';

const size = (Math.ceil(CardSize) * PixelRatio.get()) / 5;

export const getLowResUrl = (url: string) => {
  return imageToPng(url, size);
};
