// @ts-ignore
import { url as cloudinaryURL } from 'cloudinary/lib/cloudinary';
// @ts-ignore
import { pickScale } from 'react-native/Libraries/Image/AssetUtils';
import { memoFn } from '@rainbow-me/utils/memoFn';

type CloudinaryConfig = {
  width: number;
  height: number;
  format: string;
};

const PixelRatios = [1, 1.5, 2, 2.625, 2.75, 3, 3.5]; // popular ratios.
const IconsSizes = [40, 36]; // Remove 36 with TopMover
const allowedIconSizes = PixelRatios.reduce((acc, ratio) => {
  for (let size of IconsSizes) {
    acc.push(size * ratio);
  }
  return acc;
}, [] as number[]);

const supportedSizeTransformations = {
  assets: allowedIconSizes,
} as { [key: string]: number[] };

// NOTE: currently, we assume that width and height are always equal and provided.
// We use this storage only for assets.
export const signUrl = memoFn(
  (url: string, config: Partial<CloudinaryConfig>) => {
    const { format, ...widthAndHeight } = config;
    let internalAddress = url.split('/upload/')[1];
    if (format) {
      internalAddress = internalAddress.split('.')[0] + '.' + format;
    }

    const { width } = widthAndHeight;

    const directory = internalAddress.split('/')[0];

    const usedWidth = pickScale(supportedSizeTransformations[directory], width);
    const cloudinaryImg = cloudinaryURL(internalAddress, {
      height: usedWidth,
      sign_url: true,
      width: usedWidth,
    });

    if (cloudinaryImg.startsWith('http:')) {
      return 'https' + cloudinaryImg.substring(4);
    }
    return cloudinaryImg;
  },
  (url, options) =>
    `${url}-${options.width}-${options.height}-${options.format}`
);

export function isCloudinaryStorageLink(url: string): boolean {
  return url.includes('rainbowme-res.cloudinary.com');
}
