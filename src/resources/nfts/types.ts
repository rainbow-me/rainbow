import { Network } from '@/helpers/networkTypes';
import { Asset, AssetContract, AssetType } from '@/entities';
import { UniqueTokenType } from '@/utils/uniqueTokens';

export enum NFTMarketplaceId {
  OpenSea = 'opensea',
}

export type NFTMarketplace = {
  collectionId: string | undefined;
  collectionUrl: string | undefined;
  marketplaceId: NFTMarketplaceId;
  name: string | undefined;
  nftUrl: string | undefined;
};

export type NFTFloorPrice = {
  marketplaceId: NFTMarketplaceId;
  value: number;
  paymentToken: Asset;
};

export type NFTLastSale = {
  value: number;
  paymentToken: Asset;
};

type NFTCollection = {
  description: string | undefined;
  discord: string | undefined;
  externalUrl: string | undefined;
  floorPrices: NFTFloorPrice[];
  imageUrl: string | undefined;
  name: string | undefined;
  simpleHashSpamScore: number | undefined;
  twitter: string | undefined;
};

export type NFTTrait = {
  displayType: string | undefined;
  traitType: string;
  value: string | number;
};

export type NFT = {
  backgroundColor: string | undefined;
  collection: NFTCollection;
  contract: AssetContract;
  description: string | undefined;
  externalUrl: string | undefined;
  images: {
    blurhash: string | undefined;
    fullResUrl: string | undefined;
    fullResPngUrl: string | undefined;
    lowResPngUrl: string | undefined;
    mimeType: string | undefined;
  };
  isSendable: boolean;
  lastSale: NFTLastSale | undefined;
  marketplaces: NFTMarketplace[];
  name: string;
  network: Network;
  predominantColor: string | undefined;
  tokenId: string;
  traits: NFTTrait[];
  type: AssetType.nft;
  uniqueId: string;
  uniqueTokenType: UniqueTokenType;
  video_url: string | undefined;
};
