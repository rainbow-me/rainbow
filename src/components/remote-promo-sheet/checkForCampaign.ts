import { InteractionManager } from 'react-native';
import { Navigation } from '@/navigation';
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

  const isReturningUser = device.get(['isReturningUser']);

  if (!isReturningUser) {
    logger.info('Campaigns: First launch, not showing promo sheet');
    return;
  }

  const { promoSheetCollection } = await fetchPromoSheetCollection({
    order: [PromoSheetOrder.PriorityDesc],
  });

  for (const promo of promoSheetCollection?.items || []) {
    if (!promo) continue;
    logger.info(`Campaigns: Checking ${promo.sys.id}`);
    const result = await shouldPromptCampaign(promo as PromoSheet);

    logger.info(`Campaigns: ${promo.sys.id} will show: ${result}`);
    if (result) {
      isCurrentlyShown = campaigns.get(['isCurrentlyShown']);
      if (!isCurrentlyShown) {
        return triggerCampaign(promo as PromoSheet);
      }
    }
  }
};

export const triggerCampaign = async ({
  campaignKey,
  sys: { id: campaignId },
}: PromoSheet) => {
  logger.info(`Campaigns: Showing ${campaignKey} Promo`);

  setTimeout(() => {
    campaigns.set([campaignKey as string], true);
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
): Promise<boolean> => {
  const {
    campaignKey,
    sys: { id },
    actions,
  } = campaign;

  // if we aren't given proper campaign data or actions to check against, exit early here
  if (!campaignKey || !id) return false;

  // sanity check to prevent showing a campaign twice to a user or potentially showing a campaign to a fresh user
  const hasShown = campaigns.get([campaignKey]);

  logger.info(
    `Campaigns: Checking if we should prompt campaign ${campaignKey}`
  );

  const isPreviewing = actions.some(
    (action: ActionObj) => action.fn === 'isPreviewing'
  );

  // If the campaign has been viewed already or it's the first app launch, exit early
  if (hasShown && !isPreviewing) {
    logger.info(`Campaigns: User has already been shown ${campaignKey}`);
    return false;
  }

  const actionsArray = actions || ([] as ActionObj[]);
  let shouldPrompt = true;

  for (const actionObj of actionsArray) {
    const { fn, outcome, props = {} } = actionObj;
    const action = __INTERNAL_ACTION_CHECKS[fn];
    if (typeof action === 'undefined') {
      continue;
    }

    logger.info(`Campaigns: Checking action ${fn}`);
    const result = await action({ ...props, ...campaign });
    logger.info(
      `Campaigns: [${fn}] matches desired outcome: => ${result === outcome}`
    );

    if (result !== outcome) {
      shouldPrompt = false;
      break;
    }
  }

  // if all action checks pass, we will show the promo to the user
  return shouldPrompt;
};

export const __INTERNAL_ACTION_CHECKS: {
  [key: string]: ActionFn;
} = Object.keys(fns).reduce((acc, fnKey) => {
  acc[fnKey] = fns[fnKey as keyof typeof fns];
  return acc;
}, {} as { [key: string]: ActionFn });
