import { MMKV } from 'react-native-mmkv';
import { Campaign, CampaignCheckType, CampaignKey, GenericCampaignCheckResponse } from './localCampaignChecks';
import { RainbowWallet } from '@/model/wallet';
import { Navigation } from '@/navigation';
import { logger } from '@/logger';
import store from '@/redux/store';
import Routes from '@/navigation/routesNames';
import { STORAGE_IDS } from '@/model/mmkv';

const mmkv = new MMKV();

export const notificationsCampaignAction = async () => {
  logger.debug('Notifications promo: showing notifications promo');

  mmkv.set(CampaignKey.notificationsLaunch, true);

  setTimeout(() => {
    logger.debug(`Notifications promo: triggering notifications promo action`);

    Navigation.handleAction(Routes.NOTIFICATIONS_PROMO_SHEET, {});
  }, 1000);
};

export const notificationsCampaignCheck = async (): Promise<GenericCampaignCheckResponse> => {
  const hasShownCampaign = mmkv.getBoolean(CampaignKey.notificationsLaunch);
  const isFirstLaunch = mmkv.getBoolean(STORAGE_IDS.FIRST_APP_LAUNCH);

  logger.debug(`Notifications promo`, { hasShownCampaign });

  const {
    selected: currentWallet,
  }: {
    selected: RainbowWallet | undefined;
  } = store.getState().wallets;

  /**
   * stop if:
   * there's no wallet
   * the campaign has already been activated
   * the user is launching Rainbow for the first time
   */
  if (!currentWallet || hasShownCampaign || isFirstLaunch) {
    logger.debug(`Notifications promo: not activating`);
    return GenericCampaignCheckResponse.nonstarter;
  }

  logger.debug(`Notifications promo: activating`);

  NotificationsPromoCampaign.action();

  return GenericCampaignCheckResponse.activated;
};

export const NotificationsPromoCampaign: Campaign = {
  action: async () => await notificationsCampaignAction(),
  campaignKey: CampaignKey.notificationsLaunch,
  check: async () => await notificationsCampaignCheck(),
  checkType: CampaignCheckType.device,
};
