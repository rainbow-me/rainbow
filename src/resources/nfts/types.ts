import { Network } from '@/helpers/networkTypes';
import { AssetContract, AssetType } from '@/entities';
import { UniqueTokenType } from '@/utils/uniqueTokens';

export type PolygonAllowlist = Record<string, boolean>;

export enum NFTMarketplaceId {
  OpenSea = 'opensea',
}

export type NFTMarketplace = {
  collectionId: string | undefined;
  collectionUrl: string | undefined;
  floorPrice: number | undefined;
  id: string | undefined;
  marketplaceId: NFTMarketplaceId;
  name: string | undefined;
  nftUrl: string | undefined;
};

type NFTCollection = {
  description: string | undefined;
  discord: string | undefined;
  externalUrl: string | undefined;
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
  lastEthSale: number | undefined;
  marketplaces: NFTMarketplace[];
  name: string | undefined;
  network: Network;
  predominantColor: string | undefined;
  tokenId: string | undefined;
  traits: NFTTrait[];
  type: AssetType;
  uniqueId: string;
  uniqueTokenType: UniqueTokenType;
  videos: { mimeType: string | undefined; url: string | undefined };
};
