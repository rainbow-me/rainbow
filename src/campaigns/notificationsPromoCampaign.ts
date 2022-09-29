import { MMKV } from 'react-native-mmkv';
import {
  Campaign,
  CampaignCheckType,
  CampaignKey,
  GenericCampaignCheckResponse,
} from './campaignChecks';
import { RainbowWallet } from '@/model/wallet';
import { Navigation } from '@/navigation';
import { logger } from '@/utils';
import store from '@/redux/store';
import Routes from '@/navigation/routesNames';
import { STORAGE_IDS } from '@/model/mmkv';

const mmkv = new MMKV();

export const notificationsCampaignAction = async () => {
  logger.log('Campaign: Showing Notifications Promo');

  mmkv.set(CampaignKey.notificationsLaunch, true);
  setTimeout(() => {
    logger.log('triggering notifications promo action');

    Navigation.handleAction(Routes.NOTIFICATIONS_PROMO_SHEET, {});
  }, 1000);
};

export enum NotificationsPromoCampaignExclusion {
  firstLaunch = 'first_launch',
}

export const notificationsCampaignCheck = async (): Promise<
  NotificationsPromoCampaignExclusion | GenericCampaignCheckResponse
> => {
  const hasShownCampaign = mmkv.getBoolean(CampaignKey.notificationsLaunch);

  // we only want to show this campaign once
  if (hasShownCampaign) return GenericCampaignCheckResponse.nonstarter;

  const {
    selected: currentWallet,
  }: {
    selected: RainbowWallet | undefined;
  } = store.getState().wallets;

  // if there's no wallet then stop
  if (!currentWallet) return GenericCampaignCheckResponse.nonstarter;

  const isFirstLaunch = mmkv.getBoolean(STORAGE_IDS.FIRST_APP_LAUNCH);

  if (isFirstLaunch) return NotificationsPromoCampaignExclusion.firstLaunch;

  NotificationsPromoCampaign.action();
  return GenericCampaignCheckResponse.activated;
};

export const NotificationsPromoCampaign: Campaign = {
  action: async () => await notificationsCampaignAction(),
  campaignKey: CampaignKey.notificationsLaunch,
  check: async () => await notificationsCampaignCheck(),
  checkType: CampaignCheckType.deviceOrWallet,
};
