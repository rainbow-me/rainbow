import { MMKV } from 'react-native-mmkv';
import { checkIfWalletsOwnNft } from './tokenGatedUtils';
import { EthereumAddress } from '@/entities';
import { Network } from '@/helpers';
import { logger } from '@/utils';

const mmkv = new MMKV();

export const unlockableAppIconCheck = async (
  network: Network,
  tokenAddresses: EthereumAddress[],
  unlockKey: string,
  walletsToCheck: EthereumAddress[]
) => {
  logger.log(`Checking ${unlockKey} on network ${network}`);
  try {
    const found = await checkIfWalletsOwnNft(
      tokenAddresses,
      network,
      walletsToCheck
    );

    if (found) {
      mmkv.set(unlockKey, true);
      return true;
    }
    return false;
  } catch (e) {
    logger.log('areOwners blew up', e);
  }
  return false;
};
