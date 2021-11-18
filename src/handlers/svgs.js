import { image as cloudinaryImage } from 'cloudinary/lib/cloudinary';
import cloudinaryConfig from 'cloudinary/lib/config';
import {
  // @ts-ignore
  CLOUDINARY_API_KEY as apiKey,
  // @ts-ignore
  CLOUDINARY_API_SECRET as apiSecret,
  // @ts-ignore
  CLOUDINARY_CLOUD_NAME as cloudName,
} from 'react-native-dotenv';
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';

cloudinaryConfig({
  api_key: apiKey,
  api_secret: apiSecret,
  cloud_name: cloudName,
});

const RAINBOW_PROXY = 'https://images.rainbow.me/proxy?url=';

function svgToPng(url) {
  const encoded = encodeURI(url);
  const rainbowedUrl = `${RAINBOW_PROXY}${encoded}`;
  const cloudinaryImg = cloudinaryImage(rainbowedUrl, {
    sign_url: true,
    transformation: [{ fetch_format: 'png' }],
    type: 'fetch',
  });
  const cloudinaryUrl = cloudinaryImg.substr(10, cloudinaryImg.length - 14);
  return cloudinaryUrl;
}

export default function svgToPngIfNeeded(url) {
  const isSVG = isSupportedUriExtension(url, ['.svg']);
  return isSVG ? svgToPng(url) : url;
}
