import { MMKV } from 'react-native-mmkv';
import { checkIfWalletsOwnNft } from './tokenGatedUtils';
import { EthereumAddress } from '@/entities';
import { Network } from '@/helpers';
import { Navigation } from '@/navigation';
import { logger } from '@/utils';
import Routes from '@rainbow-me/routes';

const mmkv = new MMKV();

/**
 * Checks if an nft-locked app icon is unlockable, and unlocks it if so w/ corresponding explain sheet.
 *
 * @param explainSheetType ExplainSheet type to navigate to
 * @param network Network that unlocking NFTs exist on
 * @param tokenAddresses Array of addresses of unlocking NFTs
 * @param unlockKey MMKV key to unlock feature
 * @param walletsToCheck Array of wallet addresses that should be checked for feature unlockability
 * @returns true if new feature is unlocked, otherwise false
 */
export const nftLockedAppIconCheck = async (
  explainSheetType: string,
  network: Network,
  tokenAddresses: EthereumAddress[],
  unlockKey: string,
  walletsToCheck: EthereumAddress[]
) => {
  const handled = mmkv.getBoolean(unlockKey);
  logger.log(`${unlockKey} was handled?`, handled);

  if (handled) return false;

  logger.log(`Checking ${unlockKey} on network ${network}`);
  try {
    const found = await checkIfWalletsOwnNft(
      tokenAddresses,
      network,
      walletsToCheck
    );

    logger.log(`${unlockKey} check result: ${found}`);

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
