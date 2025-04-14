import { logger } from '@/logger';
import { STORAGE_IDS } from '@/model/mmkv';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { MMKV } from 'react-native-mmkv';
import { getSelectedWallet } from '@/state/wallets/wallets';
import { Campaign, CampaignCheckType, CampaignKey, GenericCampaignCheckResponse } from './localCampaignChecks';

const mmkv = new MMKV();

export const notificationsCampaignAction = async () => {
  logger.debug('[notificationsCampaignAction]: showing notifications promo');

  mmkv.set(CampaignKey.notificationsLaunch, true);

  setTimeout(() => {
    logger.debug('[notificationsCampaignAction]: triggering notifications promo action');

    Navigation.handleAction(Routes.NOTIFICATIONS_PROMO_SHEET, {});
  }, 1000);
};

export const notificationsCampaignCheck = async (): Promise<GenericCampaignCheckResponse> => {
  const hasShownCampaign = mmkv.getBoolean(CampaignKey.notificationsLaunch);
  const isFirstLaunch = mmkv.getBoolean(STORAGE_IDS.FIRST_APP_LAUNCH);

  logger.debug('[notificationsCampaignCheck]: checking if notifications promo should show', { hasShownCampaign });

  const currentWallet = getSelectedWallet();

  /**
   * stop if:
   * there's no wallet
   * the campaign has already been activated
   * the user is launching Rainbow for the first time
   */
  if (!currentWallet || hasShownCampaign || isFirstLaunch) {
    logger.debug('[notificationsCampaignCheck]: not activating notifications promo');
    return GenericCampaignCheckResponse.nonstarter;
  }

  logger.debug('[notificationsCampaignCheck]: activating notifications promo');

  NotificationsPromoCampaign.action();

  return GenericCampaignCheckResponse.activated;
};

export const NotificationsPromoCampaign: Campaign = {
  action: async () => await notificationsCampaignAction(),
  campaignKey: CampaignKey.notificationsLaunch,
  check: async () => await notificationsCampaignCheck(),
  checkType: CampaignCheckType.device,
};
