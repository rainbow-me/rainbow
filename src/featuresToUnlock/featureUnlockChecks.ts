import { nftLockedAppIconCheck } from './nftLockedAppIconCheck';
import { OptimismIcon, SmolIcon } from './unlockableFeatures';
import { EthereumAddress } from '@/entities';

// a FeatureCheck fn should take in a list of wallet addresses to check for feature unlockability
// and return true if the feature is unlocked, false otherwise
type FeatureCheck = (walletsToCheck: EthereumAddress[]) => Promise<boolean>;

// the ordering of this list is IMPORTANT, this is the order that features will be unlocked
export const featureUnlockChecks: FeatureCheck[] = [
  async (walletsToCheck: EthereumAddress[]) =>
    await nftLockedAppIconCheck(OptimismIcon, walletsToCheck),
  async (walletsToCheck: EthereumAddress[]) =>
    await nftLockedAppIconCheck(SmolIcon, walletsToCheck),
];
