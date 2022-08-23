import { nftLockedAppIconCheck } from './nftLockedAppIconCheck';
import { OptimismIcon, SmolIcon } from './unlockableFeatures';
import { EthereumAddress } from '@/entities';

// a FeatureUnlockCheck fn should take in a list of wallet addresses to check for feature unlockability
// and return true if the feature is unlocked, false otherwise
type FeatureUnlockCheck = (
  walletsToCheck: EthereumAddress[]
) => Promise<boolean>;

// the ordering of this list is IMPORTANT, this is the order that features will be unlocked
export const featureUnlockChecks: FeatureUnlockCheck[] = [
  async (walletsToCheck: EthereumAddress[]) =>
    await nftLockedAppIconCheck(OptimismIcon, walletsToCheck),
  async (walletsToCheck: EthereumAddress[]) =>
    await nftLockedAppIconCheck(SmolIcon, walletsToCheck),
];
