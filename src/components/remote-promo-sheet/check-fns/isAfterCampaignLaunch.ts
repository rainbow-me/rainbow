import { PromoSheet } from '@/graphql/__generated__/arc';

export const isAfterCampaignLaunch = ({ launchDate }: PromoSheet): boolean => {
  return new Date() > new Date(launchDate);
};
