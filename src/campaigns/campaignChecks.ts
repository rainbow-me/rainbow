import {
  SwapsPromoCampaign,
  SwapsPromoCampaignExclusion,
} from './swapsPromoCampaign';
import { NotificationsPromoCampaign } from './notificationsPromoCampaign';
import { analytics } from '@/analytics';
import { logger } from '@/utils';

export enum CampaignKey {
  swapsLaunch = 'swaps_launch',
  notificationsLaunch = 'notifications_launch',
}

export enum CampaignCheckType {
  wallet = 'wallet',
  device = 'device',
  deviceOrWallet = 'device | wallet',
}

export enum GenericCampaignCheckResponse {
  activated = 'activated',
  nonstarter = 'nonstarter',
}

export type CampaignCheckResponse =
  | GenericCampaignCheckResponse
  | SwapsPromoCampaignExclusion;

export interface Campaign {
  action(): Promise<void>; // Function to call on activating the campaign
  campaignKey: CampaignKey; // MMKV key to track if the campaign should be run
  check(): Promise<CampaignCheckResponse>; // Function that checks if the campaign should be shown
  checkType: CampaignCheckType; //
}

// the ordering of this list is IMPORTANT, this is the order that campaigns will be run
export const activeCampaigns: Campaign[] = [
  SwapsPromoCampaign,
  NotificationsPromoCampaign,
];

export const runCampaignChecks = async (): Promise<boolean> => {
  logger.log('Campaigns: Running Checks');
  for (const campaign of activeCampaigns) {
    const response = await campaign.check();
    if (response === GenericCampaignCheckResponse.activated) {
      analytics.track('Viewed Feature Promo', {
        campaign: campaign.campaignKey,
      });
      return true;
    }
    if (response !== GenericCampaignCheckResponse.nonstarter) {
      analytics.track('Excluded from Feature Promo', {
        campaign: campaign.campaignKey,
        exclusion: response,
        type: campaign.checkType,
      });
    }
  }
  return false;
};
