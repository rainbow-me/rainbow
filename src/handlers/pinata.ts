import {
  // @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
  PINATA_API_KEY,
  // @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
  PINATA_API_SECRET,
  // @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
  PINATA_API_URL,
  // @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
  PINATA_GATEWAY_URL,
} from 'react-native-dotenv';
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
