import { NativeCurrencyKey } from '@/entities';
import { Language } from '@/languages';

// have to put this here or redux gets important and tests break
type PushNotificationPermissionStatus = 'enabled' | 'disabled' | 'never asked';

// these are all reported seperately so they must be optional
export interface UserProperties {
  // settings
  currentAddressHash?: string; // NEW
  currency?: NativeCurrencyKey;
  language?: Language;
  enabledTestnets?: boolean;
  enabledFlashbots?: boolean;
  pinnedCoins?: string[];
  hiddenCOins?: string[];
  appIcon?: string;

  // assets
  NFTs?: number;
  poaps?: number;

  // nft offers
  nftOffersAmount?: number;
  nftOffersUSDValue?: number;
  nftOffersMeanOfferVariance?: number;
  nftOffersMedianOfferVariance?: number;

  // mint.fun
  numberOfMints?: number;
  numberOfFreeMints?: number;
  numberOfPaidMints?: number;

  // notifications:
  notificationsPermissionStatus?: PushNotificationPermissionStatus;
  numberOfImportedWalletsWithNotificationsTurnedOn?: number;
  numberOfWatchedWalletsWithNotificationsTurnedOn?: number;

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

  // branch
  branchCampaign?: string;
  branchReferrer?: string;
  branchReferringLink?: string;

  // to be deprecated
  assets_value?: number;
  borrowed_value?: number;
  bsc_assets_value?: number;
  deposited_value?: number;
  polygon_assets_value?: number;
  optimism_assets_value?: number;
  arbitrum_assets_value?: number;
  nft_floor_price_value?: number;
  nft_last_price_value?: number;
  avalanche_assets_value?: number;
  xdai_assets_value?: number;
  locked_value?: number;
  staked_value?: number;
  total_value?: number;
}
