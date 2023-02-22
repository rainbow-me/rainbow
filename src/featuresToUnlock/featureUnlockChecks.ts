import { unlockableAppIconCheck } from './unlockableAppIconCheck';
import {
  GoldDogeIcon,
  OptimismIcon,
  PoolyIcon,
  RainDogeIcon,
  SmolIcon,
  ZoraIcon,
} from './unlockableAppIcons';
import { EthereumAddress } from '@/entities';

// a FeatureUnlockCheck fn should take in a list of wallet addresses to check for feature unlockability
// and return true if the feature is unlocked, false otherwise
type FeatureUnlockCheck = (
  walletsToCheck: EthereumAddress[]
) => Promise<boolean>;

// the ordering of this list is IMPORTANT, this is the order that features will be unlocked
export const featureUnlockChecks: FeatureUnlockCheck[] = [
  async (walletsToCheck: EthereumAddress[]) =>
    await unlockableAppIconCheck(OptimismIcon, walletsToCheck),
  async (walletsToCheck: EthereumAddress[]) =>
    await unlockableAppIconCheck(SmolIcon, walletsToCheck),
  async (walletsToCheck: EthereumAddress[]) =>
    await unlockableAppIconCheck(ZoraIcon, walletsToCheck),
  async (walletsToCheck: EthereumAddress[]) =>
    await unlockableAppIconCheck(GoldDogeIcon, walletsToCheck),
  async (walletsToCheck: EthereumAddress[]) =>
    await unlockableAppIconCheck(RainDogeIcon, walletsToCheck),
  async (walletsToCheck: EthereumAddress[]) =>
    await unlockableAppIconCheck(PoolyIcon, walletsToCheck),
];
