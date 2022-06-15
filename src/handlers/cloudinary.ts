// @ts-ignore
import { image as cloudinaryImage } from 'cloudinary/lib/cloudinary';
import { memoFn } from '@rainbow-me/utils/memoFn';

type CloudinaryConfig = {
  width: number;
  height: number;
  format: string;
};

export const signUrl = memoFn(
  (url: string, config: Partial<CloudinaryConfig>) => {
    const { format, ...widthAndHeight } = config;
    let internalAddress = url.split('/upload/')[1];
    if (format) {
      internalAddress = internalAddress.split('.')[0] + '.' + format;
    }
    const cloudinaryImg = cloudinaryImage(internalAddress, {
      sign_url: true,
      ...widthAndHeight,
    }).split("'")[1];
    return cloudinaryImg;
  },
  (url, options) =>
    `${url}-${options.width}-${options.height}-${options.format}`
);

export function isCloudinaryStorageLink(url: string): boolean {
  return url.includes('rainbowme-res.cloudinary.com');
}
