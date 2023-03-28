import { Network } from '@/helpers/networkTypes';
import { AssetContract, AssetType } from '@/entities';
import { UniqueTokenType } from '@/utils/uniqueTokens';

export type PolygonAllowlist = Record<string, boolean>;

export enum NFTMarketplaceId {
  OpenSea = 'opensea',
}

type NFTMarketplace = {
  collectionId: string | null;
  collectionUrl: string | null;
  floorPrice: number | null;
  id: string | null;
  marketplaceId: NFTMarketplaceId;
  name: string | null;
  nftUrl: string | null;
};

type NFTCollection = {
  description: string | null;
  discord: string | null;
  externalUrl: string | null;
  imageUrl: string | null;
  name: string | null;
  simpleHashSpamScore: number | null;
  twitter: string | null;
};

export type NFTTrait = {
  displayType: string | null;
  traitType: string;
  value: string | number;
};

export type NFT = {
  backgroundColor: string | null;
  collection: NFTCollection;
  contract: AssetContract;
  description: string | null;
  externalUrl: string | null;
  images: {
    blurhash: string | null;
    fullResUrl: string | null;
    fullResPngUrl: string | null;
    lowResPngUrl: string | null;
    mimeType: string | null;
  };
  isSendable: boolean;
  lastEthSale: number | null;
  marketplaces: NFTMarketplace[];
  name: string;
  network: Network;
  predominantColor: string | null;
  tokenId: string;
  traits: NFTTrait[];
  type: AssetType;
  uniqueId: string;
  uniqueTokenType: UniqueTokenType;
  videos: { mimeType: string | null; url: string | null };
};
