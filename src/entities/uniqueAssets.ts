import { Network } from '../helpers/networkTypes';
import { AssetContract, AssetType } from '.';
import { UniqueTokenType } from '@/utils/uniqueTokens';

interface UniqueAssetLastSale {
  total_price: string;
  payment_token?: {
    symbol: string;
    usd_price: string;
  };
}

// https://docs.simplehash.com/reference/floor-price-model
export interface SimplehashPaymentToken {
  payment_token_id: string;
  name: string | null;
  symbol: string | null;
  address: string | null;
  decimals: number;
}
// https://docs.simplehash.com/reference/floor-price-model
export interface SimplehashFloorPrice {
  marketplace_id: string;
  value: number;
  payment_token: SimplehashPaymentToken;
}

// https://docs.simplehash.com/reference/sale-model
export interface SimplehashLastSale {
  from_address: string | null;
  to_address: string | null;
  quantity: number | null;
  timestamp: string;
  transaction: string;
  marketplace_id: string;
  marketplace_name: string;
  is_bundle_sale: boolean;
  payment_token: SimplehashPaymentToken | null;
  unit_price: number | null;
  total_price: number | null;
}

export interface SimplehashListing {
  id: string;
  permalink: string;
  bundle_item_number: number | null;
  listing_timestamp: string;
  expiration_timestamp: string;
  seller_address: string;
  auction_type: string | null;
  quantity: number;
  quantity_remaining: number;
  price: number;
  marketplace_id: string;
  collection_id: string;
  nft_id: string;
  payment_token: SimplehashPaymentToken | null;
}

export interface SimplehashNft {
  nft_id: string;
  chain: Network;
  contract_address: string;
  token_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  model_url: string | null;
  previews: {
    image_small_url: string | null;
    image_medium_url: string | null;
    image_large_url: string | null;
    image_opengraph_url: string | null;
    blurhash: string | null;
  };
  background_color: string | null;
  external_url: string | null;
  created_date: string | null;
  status: string;
  token_count: number;
  owner_count: number;
  contract: {
    type: string;
    name: string;
    symbol: string;
  };
  collection: SimplehashCollection;
  extra_metadata: any | null;
}

export interface Marketplace {
  id: string | null;
  name: string | null;
  nftUrl: string | null;
  collectionUrl: string | null;
  collectionId: string | null;
  floorPrice: number | null;
}

export interface Collection {
  description: string | null;
  externalUrl: string | null;
  imageUrl: string | null;
  name: string | null;
  twitter: string | null;
  discord: string | null;
  simplehashSpamScore: number | null;
}

export interface UniqueAsset {
  videos: { url: string | null; mimeType: string | null };
  description?: string | null;
  marketplaces: { opensea: Marketplace };
  images: {
    fullResUrl: string | null;
    lowResPngUrl: string | null;
    fullResPngUrl: string | null;
    mimeType: string | null;
    blurhash: string | null;
  };
  backgroundColor: string | null;
  predominantColor: string | null;
  external_link?: string | null;
  name: string;
  collection: Collection;
  traits: UniqueAssetTrait[];
  contract: AssetContract;
  uniqueTokenType: UniqueTokenType;
  background: string | null;
  tokenId: string;
  externalUrl: string | null;
  isSendable: boolean;
  lastSale: SimplehashLastSale | null;
  type: AssetType;
  uniqueId: string;
  network: Network;
}

export interface UniqueAssetTrait {
  traitType?: string;
  value?: string | number | null | undefined;
  displayType?: string;
}

export interface SeaportOrder {
  created_date: string;
  closing_date: string | null;
  listing_time: number;
  expiration_time: number;
  order_hash: string | null;
  protocol_data: {
    parameters: {
      offerer: string;
      zone: string;
      zone_hash: string;
      start_time: number;
      end_time: number;
      order_type: number;
      salt: string;
      conduitKey: string;
      nonce: string;
      offer: {
        itemType: number;
        token: string;
        identifier_or_criteria: string;
        startAmount: string;
        endAmount: string;
      }[];
      consideration: {
        itemType: number;
        token: string;
        identifier_or_criteria: string;
        startAmount: string;
        endAmount: string;
        recipient: string;
      }[];
    };
  };
  protocol_address: string | null;
  maker: SeaportAccount;
  taker: SeaportAccount | null;
  current_price: string;
  maker_fees: SeaportFees;
  taker_fees: SeaportFees;
  side: number;
  order_type: number;
  canceled: boolean;
  finalized: boolean;
  marked_invalid: boolean;
  client_signature: string | null;
}

interface SeaportAccount {
  user: string;
  profile_img_url: string;
  address: string;
  config: string;
}

interface SeaportFees {
  account: SeaportAccount;
  basis_points: string;
}
