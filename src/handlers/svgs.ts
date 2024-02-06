// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'clou... Remove this comment to see the full error message
import { image as cloudinaryImage } from 'cloudinary/lib/cloudinary';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'clou... Remove this comment to see the full error message
import cloudinaryConfig from 'cloudinary/lib/config';
import { PixelRatio } from 'react-native';
import { CLOUDINARY_API_KEY as apiKey, CLOUDINARY_API_SECRET as apiSecret, CLOUDINARY_CLOUD_NAME as cloudName } from 'react-native-dotenv';
import { deviceUtils } from '@/utils';
import isSVGImage from '@/utils/isSVG';

cloudinaryConfig({
  api_key: apiKey,
  api_secret: apiSecret,
  cloud_name: cloudName,
});

const pixelRatio = PixelRatio.get();
const RAINBOW_PROXY = 'https://images.rainbow.me/proxy?url=';

function svgToPng(url: string, big = false) {
  const encoded = encodeURI(url);
  const rainbowedUrl = `${RAINBOW_PROXY}${encoded}&v=2`;
  const cloudinaryImg = cloudinaryImage(rainbowedUrl, {
    sign_url: true,
    transformation: [{ fetch_format: 'png' }],
    type: 'fetch',
    width:
      Math.round(Math.min(2000, big ? deviceUtils.dimensions.width * pixelRatio : (deviceUtils.dimensions.width / 2) * pixelRatio) / 50) *
      50,
  });
  const cloudinaryUrl = cloudinaryImg.split("'")[1];
  return cloudinaryUrl;
}

export default function svgToPngIfNeeded(url: string | null | undefined, big?: boolean) {
  if (!url) return undefined;
  const isSVG = isSVGImage(url);
  return isSVG ? svgToPng(url, big) : url;
}
