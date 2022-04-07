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
  current_price?: string | null;
  description?: string | null;
  external_link?: string | null;
  image_original_url?: string | null;
  image_preview_url?: string | null;
  image_thumbnail_url?: string | null;
  image_url?: string | null;
  last_sale?: UniqueAssetLastSale | null;
  name: string;
  permalink: string;
  sell_orders?: {
    current_price: string;
    payment_token_contract?: {
      symbol: string;
    };
  }[];
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
  id: string;
  isSendable: boolean;
  lastPrice: number | null;
  lastPriceUsd: string | undefined | null;
  lastSale: UniqueAssetLastSale | undefined;
  lastSalePaymentToken: string | undefined | null;
  lowResUrl: string | null;
  type: AssetType;
  uniqueId: string;
  urlSuffixForAsset: string;
  isPoap?: boolean;
  network?: Network;
}

export interface UniqueAssetTrait {
  trait_type: string;
  value: string | number | null | undefined;
  display_type: string;
}
