import { FileSystemUploadType, uploadAsync } from 'expo-file-system';
import { PINATA_API_KEY, PINATA_API_SECRET, PINATA_API_URL, PINATA_GATEWAY_URL } from 'react-native-dotenv';

type UploadFilesResponse = {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate: boolean;
};
export type UploadImageReturnData = UploadFilesResponse & {
  url: string;
};

export async function uploadImage({
  path,
  filename,
  mime,
}: {
  filename: string;
  path: string;
  mime: string;
}): Promise<UploadImageReturnData> {
  // expo-file-system requires a `file://` URI; callers may pass a bare POSIX path.
  const fileUri = path.startsWith('file://') ? path : `file://${path}`;
  const response = await uploadAsync(`${PINATA_API_URL}/pinning/pinFileToIPFS`, fileUri, {
    httpMethod: 'POST',
    uploadType: FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType: mime,
    headers: {
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_API_SECRET,
    },
    // Preserve the caller-supplied filename in Pinata's metadata. Without
    // this, Pinata names the pin from the multipart Content-Disposition,
    // which expo-file-system derives from the file's basename rather than
    // any explicit `filename` parameter.
    parameters: { pinataMetadata: JSON.stringify({ name: filename }) },
  });
  const parsedBody = JSON.parse(response.body) as UploadFilesResponse;
  return {
    ...parsedBody,
    url: `${PINATA_GATEWAY_URL}/ipfs/${parsedBody.IpfsHash}`,
  };
}
