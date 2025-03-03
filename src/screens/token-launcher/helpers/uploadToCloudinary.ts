import { CLOUDINARY_CLOUD_NAME } from 'react-native-dotenv';
import { CLOUDINARY_TOKEN_LAUNCHER_PRESET, CLOUDINARY_TOKEN_LAUNCHER_PRESET_GIFS } from '../constants';

const imageMimeTypes: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  heic: 'image/heic',
  heif: 'image/heif',
};

function getMimeType(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase() || '';
  return imageMimeTypes[extension] || 'image/jpeg';
}

export async function uploadImageToCloudinary(uri: string): Promise<string> {
  const formData = new FormData();

  const mimeType = getMimeType(uri);

  // @ts-expect-error react native does not have correct type
  formData.append('file', {
    uri: uri,
    type: mimeType,
    name: uri,
  });
  // Cloudinary does not support conditional image format transformations, so we have a different preset for gifs
  const uploadPreset = mimeType.includes('gif') ? CLOUDINARY_TOKEN_LAUNCHER_PRESET_GIFS : CLOUDINARY_TOKEN_LAUNCHER_PRESET;
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = await response.json();
  return data.secure_url;
}
