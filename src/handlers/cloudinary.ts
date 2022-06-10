// @ts-ignore
import { image as cloudinaryImage } from 'cloudinary/lib/cloudinary';

type CloudinaryConfig = {
  width: number;
  height: number;
  format: string;
};

export function signUrl(
  url: string,
  config: Partial<CloudinaryConfig>
): string {
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
}

export function isCloudinaryStorageLink(url: string): boolean {
  return url.includes('rainbowme-res.cloudinary.com');
}
