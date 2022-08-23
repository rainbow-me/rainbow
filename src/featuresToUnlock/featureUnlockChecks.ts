import { nftLockedAppIconCheck } from './nftLockedAppIconCheck';
import { EthereumAddress } from '@/entities';
import { Network } from '@/helpers';

// optimism app icon
const OPTIMISM_ICON_UNLOCK_KEY: string = 'optimism_nft_app_icon';

const OPTIMISM_ICON_EXPLAIN_SHEET_TYPE: string = 'optimism_app_icon';

const OPTIMISTIC_EXPLORER_NFT_ADDRESS: EthereumAddress =
  '0x81b30ff521D1fEB67EDE32db726D95714eb00637';

const OPTIMISM_ICON_NFT_ADDRESSES: EthereumAddress[] = [
  OPTIMISTIC_EXPLORER_NFT_ADDRESS,
];

// SMOL app icon
const SMOL_ICON_UNLOCK_KEY: string = 'smol_nft_app_icon';

const SMOL_ICON_EXPLAIN_SHEET_TYPE: string = 'smol_app_icon';

const SMOL_BRAINS_NFT_ADDRESS: EthereumAddress =
  '0x6325439389e0797ab35752b4f43a14c004f22a9c';
const SMOL_BODIES_NFT_ADDRESS: EthereumAddress =
  '0x17dacad7975960833f374622fad08b90ed67d1b5';
const SMOL_BRAINS_PETS_NFT_ADDRESS: EthereumAddress =
  '0xf6cc57c45ce730496b4d3df36b9a4e4c3a1b9754';
const SMOL_BODIES_PETS_NFT_ADDRESS: EthereumAddress =
  '0xae0d0c4cc3335fd49402781e406adf3f02d41bca';

const SMOL_ICON_NFT_ADDRESSES: EthereumAddress[] = [
  SMOL_BRAINS_NFT_ADDRESS,
  SMOL_BODIES_NFT_ADDRESS,
  SMOL_BRAINS_PETS_NFT_ADDRESS,
  SMOL_BODIES_PETS_NFT_ADDRESS,
];

// a CheckFeature fn should take in a list of wallet addresses to check for feature unlockability
// and return true if the feature is unlocked, false otherwise
type CheckFeature = (walletsToCheck: EthereumAddress[]) => Promise<boolean>;

// the ordering of this list is important, this is the order that features will be unlocked
export const featureUnlockChecks: CheckFeature[] = [
  async (walletsToCheck: EthereumAddress[]) =>
    await nftLockedAppIconCheck(
      OPTIMISM_ICON_EXPLAIN_SHEET_TYPE,
      Network.optimism,
      OPTIMISM_ICON_NFT_ADDRESSES,
      OPTIMISM_ICON_UNLOCK_KEY,
      walletsToCheck
    ),
  async (walletsToCheck: EthereumAddress[]) =>
    await nftLockedAppIconCheck(
      SMOL_ICON_EXPLAIN_SHEET_TYPE,
      Network.arbitrum,
      SMOL_ICON_NFT_ADDRESSES,
      SMOL_ICON_UNLOCK_KEY,
      walletsToCheck
    ),
];
