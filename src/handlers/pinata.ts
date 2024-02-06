import { PINATA_API_KEY, PINATA_API_SECRET, PINATA_API_URL, PINATA_GATEWAY_URL } from 'react-native-dotenv';
import RNFS from 'react-native-fs';

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
  const response = await RNFS.uploadFiles({
    files: [
      {
        filename,
        filepath: path,
        filetype: mime,
        name: 'file',
      },
    ],
    headers: {
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_API_SECRET,
    },
    method: 'POST',
    toUrl: `${PINATA_API_URL}/pinning/pinFileToIPFS`,
  }).promise;
  const parsedBody = JSON.parse(response.body) as UploadFilesResponse;
  return {
    ...parsedBody,
    url: `${PINATA_GATEWAY_URL}/ipfs/${parsedBody.IpfsHash}`,
  };
}
