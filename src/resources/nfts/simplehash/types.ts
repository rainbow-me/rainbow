export enum SimplehashChain {
  Arbitrum = 'arbitrum',
  Bsc = 'bsc',
  Ethereum = 'ethereum',
  Gnosis = 'gnosis',
  Optimism = 'optimism',
  Polygon = 'polygon',
}

export enum SimplehashMarketplaceId {
  Opensea = 'opensea',
}

export enum SimplehashPaymentTokenId {
  Ethereum = 'ethereum.native',
}

// https://docs.simplehash.com/reference/sale-model
export type SimplehashTrait = {
  trait_type: string;
  value: string | number;
  display_type: string | null;
};

type SimplehashRarity = {
  rank: number | null;
  score: number | null;
  unique_attributes: number | null;
};

type SimplehashPaymentToken = {
  payment_token_id: string;
  name: string | null;
  symbol: string | null;
  address: string | null;
  decimals: number;
};

export type SimplehashListing = {
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
  collection_id: string | null;
  nft_id: string;
  payment_token: SimplehashPaymentToken | null;
};

// https://docs.simplehash.com/reference/floor-price-model
export type SimplehashFloorPrice = {
  marketplace_id: string;
  value: number;
  payment_token: SimplehashPaymentToken;
};

export type SimplehashMarketplace = {
  marketplace_id: string;
  marketplace_name: string;
  marketplace_collection_id: string;
  nft_url: string;
  collection_url: string;
  verified: boolean | null;
};

type SimplehashCollection = {
  collection_id: string | null;
  name: string | null;
  description: string | null;
  image_url: string | null;
  banner_image_url: string | null;
  external_url: string | null;
  twitter_username: string | null;
  discord_url: string | null;
  marketplace_pages: SimplehashMarketplace[];
  metaplex_mint: string | null;
  metaplex_first_verified_creator: string | null;
  spam_score: number | null;
  floor_prices: SimplehashFloorPrice[];
  top_contracts: string[];
};

export type SimplehashNFT = {
  nft_id: string;
  chain: string;
  contract_address: string;
  token_id: string | null;
  name: string | null;
  description: string | null;
  previews: {
    image_small_url: string | null;
    image_medium_url: string | null;
    image_large_url: string | null;
    image_opengraph_url: string | null;
    blurhash: string | null;
    predominant_color: string | null;
  };
  image_url: string | null;
  image_properties: {
    width: number | null;
    height: number | null;
    size: number | null;
    mime_type: string | null;
  } | null;
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
  background_color: string | null;
  external_url: string | null;
  created_date: string | null;
  status: string;
  token_count: number | null;
  owner_count: number | null;
  owners: {
    owner_address: string;
    quantity: number;
    first_acquired_date: string;
    last_acquired_date: string;
  }[];
  last_sale: {
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
  } | null;
  first_created: {
    minted_to: string | null;
    quantity: number | null;
    timestamp: string | null;
    block_number: number | null;
    transaction: string | null;
    transaction_initiator: string | null;
  } | null;
  contract: {
    type: string;
    name: string | null;
    symbol: string | null;
    deployed_by: string | null;
    deployed_via: string | null;
  };
  collection: SimplehashCollection;
  rarity: SimplehashRarity;
  extra_metadata: {
    image_original_url: string | null;
    animation_original_url: string | null;
    attributes: SimplehashTrait[] | null | undefined;
  };
};
