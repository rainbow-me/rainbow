import { MMKV } from 'react-native-mmkv';
import {
  Campaign,
  CampaignCheckType,
  CampaignKey,
  GenericCampaignCheckResponse,
} from './campaignChecks';
import { RainbowWallet } from '@/model/wallet';
import { Navigation } from '@/navigation';
import { logger } from '@/logger';
import store from '@/redux/store';
import Routes from '@/navigation/routesNames';
import { STORAGE_IDS } from '@/model/mmkv';

const mmkv = new MMKV();

export const action = async () => {
  logger.debug('NFT offers promo: showing promo');

  mmkv.set(CampaignKey.nftOffersLaunch, true);

  setTimeout(() => {
    logger.debug(`NFT offers promo: triggering promo action`);

    Navigation.handleAction(Routes.NFT_OFFERS_PROMO_SHEET, {});
  }, 1000);
};

export const check = async (): Promise<GenericCampaignCheckResponse> => {
  const hasShownCampaign = mmkv.getBoolean(CampaignKey.nftOffersLaunch);
  const isFirstLaunch = mmkv.getBoolean(STORAGE_IDS.FIRST_APP_LAUNCH);

  logger.debug(`NFT offers promo`, { hasShownCampaign });

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
    logger.debug(`NFT offers promo: not activating`);
    return GenericCampaignCheckResponse.nonstarter;
  }

  logger.debug(`NFT offers promo: activating`);

  NFTOffersPromoCampaign.action();

  return GenericCampaignCheckResponse.activated;
};

export const NFTOffersPromoCampaign: Campaign = {
  action: async () => await action(),
  campaignKey: CampaignKey.nftOffersLaunch,
  check: async () => await check(),
  checkType: CampaignCheckType.device,
};
