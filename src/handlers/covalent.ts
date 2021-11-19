import {
  // @ts-ignore
  COVALENT_ANDROID_API_KEY,
  // @ts-ignore
  COVALENT_IOS_API_KEY,
} from 'react-native-dotenv';
import { EthereumAddress } from '@rainbow-me/entities';
import Logger from 'logger';

export const getAssetsFromCovalent = async (
  chainId: Number,
  address: EthereumAddress,
  currency = String
) => {
  const url = `https://api.covalenthq.com/v1/${chainId}/address/${address}/balances_v2/?nft=false&quote-currency=${currency}&key=${
    ios ? COVALENT_IOS_API_KEY : COVALENT_ANDROID_API_KEY
  }`;
  Logger.debug('covalent url', url);
  const request = await fetch(url);
  const response = await request.json();
  if (response.data && !response.error) {
    return response.data;
  }
  return null;
};
