import { Campaign } from './campaignType';
import { SwapPromoCampaign } from './swapPromoCampaign';

// the ordering of this list is IMPORTANT, this is the order that campaigns will be run
export const activeCampaigns: Campaign[] = [SwapPromoCampaign];
