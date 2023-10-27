import { InteractionManager } from 'react-native';
import { Navigation } from '@/navigation';
import { resolveFirstRejectLast } from '@/utils';
import Routes from '@/navigation/routesNames';
import { fetchPromoSheetCollection } from '@/resources/promoSheet/promoSheetCollectionQuery';
import { logger } from '@/logger';
import { PromoSheet, PromoSheetOrder } from '@/graphql/__generated__/arc';
import { campaigns, device } from '@/storage';

import * as fns from './check-fns';

type ActionObj = {
  fn: string;
  outcome: boolean;
  props: object;
};

export type ActionFn<T = any> = (props: T) => boolean | Promise<boolean>;

export type CampaignCheckResult = {
  campaignId: string;
  campaignKey: string;
};

const TIMEOUT_BETWEEN_PROMOS = 5 * 60 * 1000; // 5 minutes in milliseconds

const timeBetweenPromoSheets = () => {
  const lastShownTimestamp = campaigns.get(['lastShownTimestamp']);

  if (!lastShownTimestamp) return TIMEOUT_BETWEEN_PROMOS;

  return Date.now() - lastShownTimestamp;
};

export const checkForCampaign = async () => {
  logger.info('Campaigns: Running Checks');
  if (timeBetweenPromoSheets() < TIMEOUT_BETWEEN_PROMOS) {
    logger.info('Campaigns: Time between promos has not exceeded timeout');
    return;
  }

  let isCurrentlyShown = campaigns.get(['isCurrentlyShown']);
  if (isCurrentlyShown) {
    logger.info('Campaigns: Promo sheet is already shown');
    return;
  }

  const { promoSheetCollection } = await fetchPromoSheetCollection({
    order: [PromoSheetOrder.PriorityDesc],
  });

  const campaignPromises = (promoSheetCollection?.items || [])
    .filter((campaign): campaign is PromoSheet => campaign !== null)
    .map(async campaign => await shouldPromptCampaign(campaign));

  // In order to save computational bandwidth, we will resolve with the first campaign that should be shown, disregarding all others
  const result = await resolveFirstRejectLast(campaignPromises);
  if (!result) {
    logger.info(`Campaigns: No promo to prompt user`);
    return;
  }

  isCurrentlyShown = campaigns.get(['isCurrentlyShown']);
  // another sanity check for making sure we don't stack promo sheets
  if (isCurrentlyShown) return;
  triggerCampaign(result);
};

export const triggerCampaign = async ({
  campaignId,
  campaignKey,
}: CampaignCheckResult) => {
  logger.info(`Campaigns: Showing ${campaignKey} Promo`);

  setTimeout(() => {
    campaigns.set([campaignKey], true);
    campaigns.set(['isCurrentlyShown'], true);
    campaigns.set(['lastShownTimestamp'], Date.now());
    InteractionManager.runAfterInteractions(() => {
      Navigation.handleAction(Routes.REMOTE_PROMO_SHEET, {
        campaignId,
        campaignKey,
      });
    });
  }, 1000);
};

export const shouldPromptCampaign = async (
  campaign: PromoSheet
): Promise<CampaignCheckResult | undefined> => {
  const {
    campaignKey,
    sys: { id },
    actions,
  } = campaign;

  // if we aren't given proper campaign data or actions to check against, exit early here
  if (!campaignKey || !id) return;

  // sanity check to prevent showing a campaign twice to a user or potentially showing a campaign to a fresh user
  const hasShown = campaigns.get([campaignKey]);
  const isReturningUser = device.get(['isReturningUser']);

  logger.info(
    `Campaigns: Checking if we should prompt campaign ${campaignKey}`
  );
  logger.info(`Campaigns: viewed: ${hasShown}`);
  logger.info(`Campaigns: first launch: ${!isReturningUser}`);

  // If the campaign has been viewed already or it's the first app launch, exit early
  // if (hasShown || !isReturningUser) {
  //   return;
  // }

  const shouldPrompt = (
    await Promise.all(
      ((actions || []) as ActionObj[]).map(
        async ({ fn, outcome, props = {} }) => {
          const action = __INTERNAL_ACTION_CHECKS[fn];
          if (typeof action === 'undefined') return false;

          logger.info(`Campaigns: Checking action ${fn}`);
          const result = await action({ ...props, ...campaign });
          logger.info(
            `Campaigns: [${fn}] matches desired outcome: => ${
              result === outcome
            }`
          );
          return result === outcome;
        }
      )
    )
  ).every(result => result);

  // if all action checks pass, we will show the promo to the user
  return shouldPrompt ? { campaignId: id, campaignKey } : undefined;
};

export const __INTERNAL_ACTION_CHECKS: {
  [key: string]: ActionFn;
} = Object.keys(fns).reduce((acc, fnKey) => {
  acc[fnKey] = fns[fnKey as keyof typeof fns];
  return acc;
}, {} as { [key: string]: ActionFn });
