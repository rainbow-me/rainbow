import { Network } from '../helpers/networkTypes';
import { AssetContract, AssetType } from '.';

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

export interface UniqueAsset {
  animation_url?: string | null;
  description?: string | null;
  external_link?: string | null;
  image_original_url?: string | null;
  image_preview_url?: string | null;
  image_thumbnail_url?: string | null;
  image_url?: string | null;
  last_sale?: UniqueAssetLastSale | null;
  name: string;
  permalink: string;
  traits: UniqueAssetTrait[];
  asset_contract: AssetContract;
  background: string | null;
  collection: {
    description?: string | null;
    discord_url?: string | null;
    external_url?: string | null;
    featured_image_url?: string | null;
    floor_prices?: SimplehashFloorPrice[];
    hidden?: boolean | null;
    image_url?: string | null;
    name: string;
    short_description?: string | null;
    slug: string;
    twitter_username?: string | null;
    wiki_link?: string | null;
  };
  familyImage: string | null | undefined;
  familyName: string | null | undefined;
  id: string;
  isSendable: boolean;
  lastSale: SimplehashLastSale | null;
  lowResUrl: string | undefined | null;
  marketplaceCollectionUrl?: string | null;
  marketplaceId: string | null;
  marketplaceName: string | null;
  spamScore: number;
  type: AssetType;
  uniqueId: string;
  /**
   * @description a computed unique value comprised of <network>_<address>_<token_id>
   */
  fullUniqueId: string;
  isPoap?: boolean;
  network: Network;
  seaport_sell_orders?: SeaportOrder[];
}

export interface UniqueAssetTrait {
  trait_type?: string;
  value?: string | number | null | undefined;
  display_type?: string;
  max_value?: string | number | null | undefined;
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
