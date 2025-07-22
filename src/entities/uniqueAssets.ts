import { ChainId, Network } from '@/state/backendNetworks/types';
import { AssetType } from '.';
import { Address } from 'viem';
import { NftTokenType } from '@/graphql/__generated__/arc';

export interface UniqueAssetTrait {
  trait_type: string;
  value: string;
}

export interface UniqueAsset {
  name: string;
  acquiredAt?: string | null;
  uniqueId: `${Network}_${Address}_${number}`;
  contractAddress: Address;
  tokenId: string;
  network: Network;
  chainId: ChainId;
  description?: string | null;
  standard: NftTokenType;
  isSendable: boolean;
  backgroundColor?: string | null;
  images: {
    highResUrl?: string | null;
    lowResUrl?: string | null;
    mimeType?: string | null;
    animatedUrl?: string | null;
    animatedMimeType?: string | null;
  };
  type: AssetType;
  collectionName?: string | null;
  collectionUrl?: string | null;
  collectionDescription?: string | null;
  collectionImageUrl?: string | null;
  discordUrl?: string | null;
  twitterUrl?: string | null;
  websiteUrl?: string | null;
  marketplaceName?: string | null;
  marketplaceUrl?: string | null;
  floorPrice?: number | null;
  traits: UniqueAssetTrait[];
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
