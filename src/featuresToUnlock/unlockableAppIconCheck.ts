import { MMKV } from 'react-native-mmkv';
import { checkIfWalletsOwnNft } from './tokenGatedUtils';
import { UnlockableAppIcon } from './unlockableAppIcons';
import { EthereumAddress } from '@/entities';
import { Navigation } from '@/navigation';
import { logger } from '@/utils';
import Routes from '@/navigation/routesNames';
import { analytics } from '@/analytics';
import { campaigns } from '@/storage';

const mmkv = new MMKV();

/**
 * Checks if an nft-locked app icon is unlockable, and unlocks it if so w/ corresponding explain sheet.
 *
 * @param appIconFeature the custom app icon to try and unlock
 * @returns true if appIconFeature unlocked state changes to true, otherwise false
 */
export const unlockableAppIconCheck = async (
  appIconFeature: UnlockableAppIcon,
  walletsToCheck: EthereumAddress[]
) => {
  const { key, explainSheetType, network, unlockKey, unlockingNfts } =
    appIconFeature;

  const handled = mmkv.getBoolean(unlockKey);

  logger.log(`${unlockKey} was handled?`, handled);

  if (handled) return false;

  logger.log(`Checking ${unlockKey} on network ${network}`);
  try {
    const found = await checkIfWalletsOwnNft(
      unlockingNfts,
      network,
      walletsToCheck
    );

    logger.log(`${unlockKey} check result: ${found}`);

    // We open the sheet with a setTimeout 1 sec later to make sure we can return first
    // so we can abort early if we're showing a sheet to prevent 2+ sheets showing at the same time

    setTimeout(() => {
      if (found) {
        mmkv.set(unlockKey, true);
        logger.log(
          'Feature check',
          unlockKey,
          'set to true. Wont show up anymore!'
        );
        analytics.track('Viewed App Icon Unlock', { campaign: key });
        Navigation.handleAction(Routes.EXPLAIN_SHEET, {
          type: explainSheetType,
          onPress: () => {
            analytics.track('Activated App Icon Unlock', { campaign: key });
            setTimeout(() => {
              Navigation.handleAction(Routes.SETTINGS_SHEET, {});
              setTimeout(() => {
                Navigation.handleAction(Routes.SETTINGS_SHEET, {
                  screen: 'AppIconSection',
                });
              }, 300);
            }, 300);
          },
          handleClose: () => {
            campaigns.set(['isCurrentlyShown'], false);
            analytics.track('Dismissed App Icon Unlock', { campaign: key });
          },
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
