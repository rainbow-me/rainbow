import { TokenGateCheckerNetwork, TokenInfo, checkIfWalletsOwnNft, checkIfWalletsOwnNft1155 } from './tokenGatedUtils';
import { EthereumAddress } from '@/entities';
import { Navigation } from '@/navigation';
import { RainbowError, logger } from '@/logger';
import Routes from '@/navigation/routesNames';
import { UnlockableAppIconKey, unlockableAppIcons } from '@/appIcons/appIcons';
import { MMKV } from 'react-native-mmkv';
import { STORAGE_IDS } from '@/model/mmkv';
import { triggerOnSwipeLayout } from '@/navigation/onNavigationStateChange';

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

  if (handled) return false;

  logger.debug(`[unlockableAppIconCheck]: ${appIconKey} was handled? ${handled}`);

  try {
    const promises = (Object.keys(appIcon.unlockingNFTs) as TokenGateCheckerNetwork[]).map(network => {
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
      return allChecks;
    });

    const allPromises = promises.flat();
    const results = await Promise.all(allPromises);

    const found = results.some(result => !!result);
    if (!found) {
      unlockableAppIconStorage.set(appIconKey, false);
    }

    logger.debug(`[unlockableAppIconCheck]: ${appIconKey} check result: ${found}`);

    if (found) {
      unlockableAppIconStorage.set(appIconKey, true);
      logger.debug(`[unlockableAppIconCheck]: Feature check ${appIconKey} set to true. Wont show up anymore!`);

      // Temporarily ignore some icons
      // We can get rid of this in 2025!
      const iconsToIgnore = [
        'optimism',
        'smol',
        'zora',
        'golddoge',
        'raindoge',
        'pooly',
        'finiliar',
        'zorb',
        'poolboy',
        'adworld',
        'farcaster',
      ];

      if (iconsToIgnore.includes(appIconKey)) {
        return false;
      }

      triggerOnSwipeLayout(() => Navigation.handleAction(Routes.APP_ICON_UNLOCK_SHEET, { appIconKey }));

      return true;
    }
    return found;
  } catch (e) {
    logger.error(new RainbowError('[unlockableAppIconCheck]: UnlockableAppIconCheck blew up'), { e });
  }
  return false;
};
