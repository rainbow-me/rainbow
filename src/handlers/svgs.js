import { image as cloudinaryImage } from 'cloudinary/lib/cloudinary';
import cloudinaryConfig from 'cloudinary/lib/config';
import { PixelRatio } from 'react-native';
import {
  // @ts-ignore
  CLOUDINARY_API_KEY as apiKey,
  // @ts-ignore
  CLOUDINARY_API_SECRET as apiSecret,
  // @ts-ignore
  CLOUDINARY_CLOUD_NAME as cloudName,
} from 'react-native-dotenv';
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';
import { deviceUtils } from '@rainbow-me/utils';
console.log("hi");
console.log(cloudName);
cloudinaryConfig({
  api_key: apiKey,
  api_secret: apiSecret,
  cloud_name: cloudName,
});

const pixelRatio = PixelRatio.get();
const RAINBOW_PROXY = 'https://images.rainbow.me/proxy?url=';

function svgToPng(url, big = false) {
  const encoded = encodeURI(url);
  const rainbowedUrl = `${RAINBOW_PROXY}${encoded}&v=2`;
  const cloudinaryImg = cloudinaryImage(rainbowedUrl, {
    sign_url: true,
    transformation: [{ fetch_format: 'png' }],
    type: 'fetch',
    width: big
      ? deviceUtils.dimensions.width * pixelRatio
      : (deviceUtils.dimensions.width / 2) * pixelRatio,
  });
  const cloudinaryUrl = cloudinaryImg.split("'")[1];
  return cloudinaryUrl;
}

export default function svgToPngIfNeeded(url, big) {
  const isSVG = isSupportedUriExtension(url, ['.svg']);
  return isSVG ? svgToPng(url, big) : url;
}
