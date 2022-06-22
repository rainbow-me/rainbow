// @ts-ignore
import { url as cloudinaryURL } from 'cloudinary/lib/cloudinary';
import { memoFn } from '@rainbow-me/utils/memoFn';
import logger from 'logger';

type CloudinaryConfig = {
  width: number;
  height: number;
  format: string;
};

const PixelRatios = [1, 1.5, 2, 3, 3.5];
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

export const signUrl = memoFn(
  (url: string, config: Partial<CloudinaryConfig>) => {
    const { format, ...widthAndHeight } = config;
    let internalAddress = url.split('/upload/')[1];
    if (format) {
      internalAddress = internalAddress.split('.')[0] + '.' + format;
    }

    const directory = internalAddress.split('/')[0];

    if (supportedSizeTransformations[directory] && widthAndHeight.width) {
      if (
        !(supportedSizeTransformations[directory] as number[]).includes(
          widthAndHeight.width
        )
      ) {
        logger.error(url, 'Incorrect size sent to Cloudinary');
        return null;
      }
    }

    const cloudinaryImg = cloudinaryURL(internalAddress, {
      sign_url: true,
      ...widthAndHeight,
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
