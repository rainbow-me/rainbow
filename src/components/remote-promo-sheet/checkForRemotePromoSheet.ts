/* eslint-disable no-await-in-loop */
import { InteractionManager } from 'react-native';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { fetchPromoSheetCollection } from '@/resources/promoSheet/promoSheetCollectionQuery';
import { logger } from '@/logger';
import { PromoSheet, PromoSheetOrder } from '@/graphql/__generated__/arc';
import { device } from '@/storage';

import * as fns from '@/components/remote-promo-sheet/check-fns';
import { remotePromoSheetsStore } from '@/state/remotePromoSheets/remotePromoSheets';

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

const TIMEOUT_BETWEEN_PROMOS = 5 * 60 * 1_000; // 5 minutes
const TIMEOUT_TO_SHOW_PROMO = 1_000;

const timeBetweenPromoSheets = () => {
  const lastShownAt = remotePromoSheetsStore.getState().lastShownTimestamp;
  if (!lastShownAt) return TIMEOUT_BETWEEN_PROMOS;
  return Date.now() - lastShownAt;
};

export const checkForRemotePromoSheet = async () => {
  logger.debug('[checkForPromoSheet]: Running Checks');
  if (timeBetweenPromoSheets() < TIMEOUT_BETWEEN_PROMOS) {
    logger.debug('[checkForPromoSheet]: Time between promotions has not exceeded timeout');
    return;
  }

  const isReturningUser = device.get(['isReturningUser']);
  if (!isReturningUser) {
    logger.debug('[checkForPromoSheet]: First launch, not showing promo sheet');
    return;
  }

  const { promoSheetCollection } = await fetchPromoSheetCollection({
    order: [PromoSheetOrder.PriorityDesc],
  });

  for (const promo of promoSheetCollection?.items || []) {
    if (!promo) continue;
    logger.debug(`[checkForPromoSheet]: Checking ${promo.campaignKey}`);
    const result = await shouldPromptCampaign(promo as PromoSheet);
    if (!result) {
      logger.debug(`[checkForPromoSheet]: ${promo.campaignKey} will not show`);
      continue;
    }

    return triggerCampaign(promo as PromoSheet);
  }
};

export const triggerCampaign = async ({ campaignKey, sys: { id: campaignId } }: PromoSheet) => {
  setTimeout(() => {
    InteractionManager.runAfterInteractions(() => {
      logger.debug(`[checkForPromoSheet]: Showing ${campaignKey} Promo`);
      remotePromoSheetsStore.getState().showSheet(campaignId);
      Navigation.handleAction(Routes.REMOTE_PROMO_SHEET, {
        campaignId,
        campaignKey,
      });
    });
  }, TIMEOUT_TO_SHOW_PROMO);
};

export const shouldPromptCampaign = async (campaign: PromoSheet): Promise<boolean> => {
  const {
    campaignKey,
    sys: { id },
    actions,
  } = campaign;

  // if we aren't given proper campaign data, exit early here
  if (!campaignKey || !id) return false;

  const actionsArray = actions || ([] as ActionObj[]);
  logger.debug(`[checkForPromoSheet]: Checking if we should prompt campaign ${campaignKey}`);

  const hasShown = remotePromoSheetsStore.getState().getSheet(id)?.hasBeenShown;
  // If the campaign has been viewed, exit early
  if (hasShown) {
    logger.debug(`[checkForPromoSheet]: User has already been shown promo sheet: ${campaignKey}`);
    return false;
  }

  let shouldPrompt = true;

  for (const actionObj of actionsArray) {
    const { fn, outcome, props = {} } = actionObj;
    const action = __INTERNAL_ACTION_CHECKS[fn];
    if (typeof action === 'undefined') {
      continue;
    }

    logger.debug(`[checkForPromoSheet]: Checking action ${fn}`);
    const result = await action({ ...props, ...campaign });
    logger.debug(`[checkForPromoSheet]: [${fn}] matches desired outcome: => ${result === outcome}`);

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
} = Object.keys(fns).reduce(
  (acc, fnKey) => {
    acc[fnKey] = fns[fnKey as keyof typeof fns];
    return acc;
  },
  {} as { [key: string]: ActionFn }
);
