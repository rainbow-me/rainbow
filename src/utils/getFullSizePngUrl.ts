import { PixelRatio } from 'react-native';
import { imageToPng } from '@/handlers/imgix';
import { deviceUtils } from '@/utils';

export const GOOGLE_USER_CONTENT_URL = 'https://lh3.googleusercontent.com/';
const pixelRatio = PixelRatio.get();
const deviceWidth = deviceUtils.dimensions.width;
const size = deviceWidth * pixelRatio;
const MAX_IMAGE_SCALE = 3;

export const getFullSizePngUrl = (url: string) =>
  imageToPng(url, size * MAX_IMAGE_SCALE);
