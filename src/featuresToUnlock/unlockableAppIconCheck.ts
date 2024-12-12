import { TokenGateCheckerNetwork, TokenInfo, checkIfWalletsOwnNft, checkIfWalletsOwnNft1155 } from './tokenGatedUtils';
import { EthereumAddress } from '@/entities';
import { Navigation } from '@/navigation';
import { RainbowError, logger } from '@/logger';
import Routes from '@/navigation/routesNames';
import { UnlockableAppIconKey, unlockableAppIcons } from '@/appIcons/appIcons';
import { MMKV } from 'react-native-mmkv';
import { STORAGE_IDS } from '@/model/mmkv';

export const unlockableAppIconStorage = new MMKV({
  id: STORAGE_IDS.UNLOCKABLE_APP_ICONS,
});

/**
 * Checks if an nft-locked app icon is unlockable, and unlocks it if so w/ corresponding explain sheet.
 *
 * @param appIconKey key of unlockableAppIcons
 * @returns true if appIconFeature unlocked state changes to true, otherwise false
 */
export const unlockableAppIconCheck = async (appIconKey: UnlockableAppIconKey, walletsToCheck: EthereumAddress[]) => {
  const appIcon = unlockableAppIcons[appIconKey];

  const handled = unlockableAppIconStorage.getBoolean(appIconKey);

  logger.debug(`[unlockableAppIconCheck]: ${appIconKey} was handled? ${handled}`);

  if (handled && appIconKey !== 'newTest_1155') return false;

  try {
    const found = (
      await Promise.all(
        (Object.keys(appIcon.unlockingNFTs) as TokenGateCheckerNetwork[]).map(async network => {
          const nfts = appIcon.unlockingNFTs[network];
          if (!nfts) return;
          logger.debug(`[unlockableAppIconCheck]: Checking ${appIconKey} on network ${network}`);
          const non1155s: EthereumAddress[] = [];
          const all1155s: TokenInfo[] = [];

          const values = Object.values(nfts);
          values.forEach(value => {
            if (typeof value === 'string') {
              non1155s.push(value);
            } else {
              all1155s.push(value);
            }
          });
          const allChecks = [];
          if (non1155s.length > 0) {
            allChecks.push(checkIfWalletsOwnNft(non1155s, network, walletsToCheck));
          }
          if (all1155s.length > 0) {
            allChecks.push(checkIfWalletsOwnNft1155(all1155s, network, walletsToCheck));
          }
          return Promise.all(allChecks);
        })
      )
    ).some(result => !!result);

    logger.debug(`[unlockableAppIconCheck]: ${appIconKey} check result: ${found}`);

    // We open the sheet with a setTimeout 1 sec later to make sure we can return first
    // so we can abort early if we're showing a sheet to prevent 2+ sheets showing at the same time

    setTimeout(() => {
      if (found) {
        unlockableAppIconStorage.set(appIconKey, true);
        logger.debug(`[unlockableAppIconCheck]: Feature check ${appIconKey} set to true. Wont show up anymore!`);
        Navigation.handleAction(Routes.APP_ICON_UNLOCK_SHEET, { appIconKey });
        return true;
      }
    }, 1000);
    return found;
  } catch (e) {
    logger.error(new RainbowError('[unlockableAppIconCheck]: UnlockableAppIconCheck blew up'), { e });
  }
  return false;
};
