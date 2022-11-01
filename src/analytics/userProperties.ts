import { NativeCurrencyKey } from '@/entities';

// these are all reported seperately so they must be optional
export interface UserProperties {
  // settings
  currentAddressHash?: string; // NEW
  currency?: NativeCurrencyKey;
  enabledTestnets?: boolean;
  enabledFlashbots?: boolean;
  pinnedCoins?: string[];
  hiddenCOins?: string[];

  // assets
  NFTs?: number;
  poaps?: number;

  // ens
  // TODO: remove ensProfile tracking the entire object
  ensProfile?: Record<any, any>;
  hasPrimaryENS?: boolean;
  numberOfENSOwned?: number;
  numberOfENSWithAvatarOrCoverSet?: number;
  numberOfENSWithOtherMetadataSet?: number;
  numberOfENSWithPrimaryNameSet?: number;

  // device info
  screenHeight?: number;
  screenWidth?: number;
  screenScale?: number;

  // to be deprecated
  assets_value?: number;
  borrowed_value?: number;
  bsc_assets_value?: number;
  deposited_value?: number;
  polygon_assets_value?: number;
  locked_value?: number;
  staked_value?: number;
  total_value?: number;
}
