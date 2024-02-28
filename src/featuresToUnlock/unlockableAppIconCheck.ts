import { MMKV } from 'react-native-mmkv';
import { checkIfWalletsOwnNft } from './tokenGatedUtils';
import { UnlockableAppIcon } from './unlockableAppIcons';
import { EthereumAddress } from '@/entities';
import { Navigation } from '@/navigation';
import { logger } from '@/utils';
import Routes from '@/navigation/routesNames';
import { analytics } from '@/analytics';
import { campaigns } from '@/storage';
import { unlockableAppIconStorage, unlockableAppIcons } from '@/appIcons/constants';
import { Network } from '@/helpers';

/**
 * Checks if an nft-locked app icon is unlockable, and unlocks it if so w/ corresponding explain sheet.
 *
 * @param appIconKey key of unlockableAppIcons
 * @returns true if appIconFeature unlocked state changes to true, otherwise false
 */
export const unlockableAppIconCheck = async (appIconKey: string, walletsToCheck: EthereumAddress[]) => {
  const appIcon = unlockableAppIcons[appIconKey];

  const handled = unlockableAppIconStorage.getBoolean(appIconKey);

  logger.log(`${appIconKey} was handled?`, handled);

  if (handled) return false;

  try {
    const found = (
      await Promise.all(
        Object.entries(appIcon.unlockingNFTs).map(([network, nfts]) => {
          logger.log(`Checking ${appIconKey} on network ${network}`);
          return checkIfWalletsOwnNft(nfts, network as Network, walletsToCheck);
        })
      )
    ).some(result => !!result);

    logger.log(`${appIconKey} check result: ${found}`);

    // We open the sheet with a setTimeout 1 sec later to make sure we can return first
    // so we can abort early if we're showing a sheet to prevent 2+ sheets showing at the same time

    setTimeout(() => {
      if (found) {
        unlockableAppIconStorage.set(appIconKey, true);
        logger.log('Feature check', appIconKey, 'set to true. Wont show up anymore!');
        analytics.track('Viewed App Icon Unlock', { campaign: appIconKey });
        // Navigation.handleAction(Routes.EXPLAIN_SHEET, {
        //   type: explainSheetType,
        //   onPress: () => {
        //     analytics.track('Activated App Icon Unlock', { campaign: key });
        //     setTimeout(() => {
        //       Navigation.handleAction(Routes.SETTINGS_SHEET, {});
        //       setTimeout(() => {
        //         Navigation.handleAction(Routes.SETTINGS_SHEET, {
        //           screen: 'AppIconSection',
        //         });
        //       }, 300);
        //     }, 300);
        //   },
        //   handleClose: () => {
        //     campaigns.set(['isCurrentlyShown'], false);
        //     analytics.track('Dismissed App Icon Unlock', { campaign: key });
        //   },
        // });
        return true;
      }
    }, 1000);
    return found;
  } catch (e) {
    logger.log('areOwners blew up', e);
  }
  return false;
};
