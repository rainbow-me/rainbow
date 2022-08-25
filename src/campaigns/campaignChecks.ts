import { SwapPromoCampaign } from './swapPromoCampaign';
import { logger } from '@/utils';

export enum CampaignKey {
  swapsLaunch = 'swaps_launch',
}

export interface Campaign {
  action(): Promise<void>; // Function to call on activating the campaign
  campaignKey: CampaignKey; // MMKV key to track if the campaign should be run
  check(): Promise<boolean>; // Function that checks if the campaign should be shown
}

// the ordering of this list is IMPORTANT, this is the order that campaigns will be run
export const activeCampaigns: Campaign[] = [SwapPromoCampaign];

export const runCampaignChecks = async (): Promise<boolean> => {
  logger.log('Campaigns: Running Checks');
  for (const campaign of activeCampaigns) {
    const shownCampaign = await campaign.check();
    if (shownCampaign) {
      return true;
    }
    return false;
  }
  return false;
};
