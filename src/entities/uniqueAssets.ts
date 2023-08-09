import { Network } from '../helpers/networkTypes';
import { AssetContract, AssetType } from '.';

interface UniqueAssetLastSale {
  total_price: string;
  payment_token?: {
    symbol: string;
    usd_price: string;
  };
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
    hidden?: boolean | null;
    image_url?: string | null;
    name: string;
    short_description?: string | null;
    slug: string;
    twitter_username?: string | null;
    wiki_link?: string | null;
  };
  currentPrice: number | null;
  familyImage: string | null | undefined;
  familyName: string | null | undefined;
  floorPriceEth?: number | undefined;
  id: string;
  isSendable: boolean;
  lastPrice: number | null;
  lastPriceUsd: string | undefined | null;
  lastSale: UniqueAssetLastSale | undefined;
  lastSalePaymentToken: string | undefined | null;
  lowResUrl: string | null;
  marketplaceCollectionUrl?: string | null;
  marketplaceId: string | null;
  marketplaceName: string | null;
  type: AssetType;
  uniqueId: string;
  /**
   * @description a computed unique value comprised of <network>_<address>_<token_id>
   */
  fullUniqueId: string;
  urlSuffixForAsset: string;
  isPoap?: boolean;
  network: Network;
  seaport_sell_orders?: SeaportOrder[];
  predominantColor?: string;

  // hacky shit
  video_url: string | null;
  video_properties: {
    width: number | null;
    height: number | null;
    duration: number | null;
    video_coding: string | null;
    audio_coding: string | null;
    size: number | string;
    mime_type: string | null;
  } | null;
  audio_url: string | null;
  audio_properties: {
    duration: number | null;
    audio_coding: string | null;
    size: number | string;
    mime_type: string | null;
  } | null;
  model_url: string | null;
  model_properties: {
    size: number | null;
    mime_type: string | null;
  } | null;
}

export interface UniqueAssetTrait {
  trait_type: string;
  value: string | number | null | undefined;
  display_type: string;
  max_value: string | number | null | undefined;
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
