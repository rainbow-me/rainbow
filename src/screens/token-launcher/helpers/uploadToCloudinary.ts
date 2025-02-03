import { CLOUDINARY_CLOUD_NAME } from 'react-native-dotenv';

// TODO:
function getMimeType(uri: string): string {
  const extension = uri.split('.').pop();
  return extension === 'png' ? 'image/png' : 'image/jpeg';
}

export async function uploadImageToCloudinary(uri: string, uploadPreset: string): Promise<string> {
  const formData = new FormData();

  // @ts-expect-error does not have correct type
  formData.append('file', {
    uri: uri,
    type: getMimeType(uri),
    name: uri,
  });
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
