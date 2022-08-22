import { MMKV } from 'react-native-mmkv';
import { checkIfWalletsOwnNft } from './tokenGatedUtils';
import { EthereumAddress } from '@/entities';
import { Network } from '@/helpers';
import { Navigation } from '@/navigation';
import { logger } from '@/utils';
import Routes from '@rainbow-me/routes';

const mmkv = new MMKV();

export const nftAppIconCheck = async (
  explainSheetType: string,
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

    // We open the sheet with a setTimeout 1 sec later to make sure we can return first
    // so we can abort early if we're showing a sheet to prevent 2+ sheets showing at the same time

    setTimeout(() => {
      if (found) {
        Navigation.handleAction(Routes.EXPLAIN_SHEET, {
          onClose: () => {
            mmkv.set(unlockKey, true);
            logger.log(
              'Feature check',
              unlockKey,
              'set to true. Wont show up anymore!'
            );
          },
          type: explainSheetType,
        });
        return true;
      }
    }, 1000);
    return found;
  } catch (e) {
    logger.log('areOwners blew up', e);
  }
  return false;
};
