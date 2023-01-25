import { EthereumAddress } from '@/entities';
import { getGlobal, saveGlobal } from './common';

const nftOffersKey = (key: EthereumAddress) => `nftOffers.${key}`;

export const getNFTOffers = async (key: EthereumAddress) => {
  const offers = await getGlobal(nftOffersKey(key), null);
  return offers ? JSON.parse(offers) : null;
};

export const saveNFTOffers = (key: EthereumAddress, value: any) =>
  saveGlobal(nftOffersKey(key), JSON.stringify(value));
