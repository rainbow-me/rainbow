import { Network } from '../helpers/networkTypes';
import { AssetContract, AssetType } from '.';
import { UniqueTokenType } from '@/utils/uniqueTokens';

interface Marketplace {
  collectionId: string | null;
  collectionUrl: string | null;
  floorPrice: number | null;
  id: string | null;
  name: string | null;
  nftUrl: string | null;
}

interface Collection {
  description: string | null;
  discord: string | null;
  externalUrl: string | null;
  imageUrl: string | null;
  name: string | null;
  simplehashSpamScore: number | null;
  twitter: string | null;
}

interface LastSale {
  from_address: string | null;
  to_address: string | null;
  quantity: number | null;
  timestamp: string;
  transaction: string;
  marketplace_id: string;
  marketplace_name: string;
  is_bundle_sale: boolean;
  payment_token: {
    payment_token_id: string;
    name: string | null;
    symbol: string | null;
    address: string | null;
    decimals: number;
  } | null;
  unit_price: number | null;
  total_price: number | null;
}

export interface Trait {
  displayType: string | null;
  traitType: string;
  value: string | number;
}

export interface UniqueAsset {
  backgroundColor: string | null;
  collection: Collection;
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
  lastSale: LastSale | null;
  marketplaces: { opensea: Marketplace };
  name: string;
  network: Network;
  predominantColor: string | null;
  tokenId: string;
  traits: Trait[];
  type: AssetType;
  uniqueId: string;
  uniqueTokenType: UniqueTokenType;
  videos: { mimeType: string | null; url: string | null };
}
