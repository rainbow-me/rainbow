import { PixelRatio } from 'react-native';
import { imageToPng } from '@/handlers/imgix';
import { deviceUtils } from '@/utils';

const pixelRatio = PixelRatio.get();
const deviceWidth = deviceUtils.dimensions.width;
const size = deviceWidth * pixelRatio;
const MAX_IMAGE_SCALE = 3;
export const FULL_NFT_IMAGE_SIZE = size * MAX_IMAGE_SCALE;

export const getFullSizePngUrl = (url: string) =>
  imageToPng(url, FULL_NFT_IMAGE_SIZE);
