import { InteractionManager } from 'react-native';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { fetchPromoSheetCollection } from '@/resources/promoSheet/promoSheetCollectionQuery';
import { logger } from '@/logger';
import { PromoSheet, PromoSheetOrder } from '@/graphql/__generated__/arc';
import { device } from '@/storage';

import * as fns from './check-fns';
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

const TIMEOUT_BETWEEN_PROMOS = 5 * 60 * 1000; // 5 minutes in milliseconds

const timeBetweenPromoSheets = () => {
  const lastShownAt = remotePromoSheetsStore.getState().lastShownTimestamp;
  if (!lastShownAt) return TIMEOUT_BETWEEN_PROMOS;
  return Date.now() - lastShownAt;
};

export const checkForCampaign = async () => {
  logger.debug('Campaigns: Running Checks');
  if (timeBetweenPromoSheets() < TIMEOUT_BETWEEN_PROMOS) {
    logger.debug('Campaigns: Time between promos has not exceeded timeout');
    return;
  }

  const isShown = remotePromoSheetsStore.getState().isShown;
  if (isShown) {
    logger.debug('Campaigns: Another remote sheet is currently shown');
    return;
  }

  const isReturningUser = device.get(['isReturningUser']);
  if (!isReturningUser) {
    logger.debug('Campaigns: First launch, not showing promo sheet');
    return;
  }

  const { promoSheetCollection } = await fetchPromoSheetCollection({
    order: [PromoSheetOrder.PriorityDesc],
  });

  for (const promo of promoSheetCollection?.items || []) {
    if (!promo) continue;
    logger.debug(`Campaigns: Checking ${promo.sys.id}`);
    const result = await shouldPromptCampaign(promo as PromoSheet);

    logger.debug(`Campaigns: ${promo.sys.id} will show: ${result}`);
    if (result) {
      const isShown = remotePromoSheetsStore.getState().isShown;
      if (!isShown) {
        return triggerCampaign(promo as PromoSheet);
      }
    }
  }
};

export const triggerCampaign = async ({ campaignKey, sys: { id: campaignId } }: PromoSheet) => {
  logger.debug(`Campaigns: Showing ${campaignKey} Promo`);

  setTimeout(() => {
    remotePromoSheetsStore.getState().showSheet(campaignId);
    InteractionManager.runAfterInteractions(() => {
      Navigation.handleAction(Routes.REMOTE_PROMO_SHEET, {
        campaignId,
        campaignKey,
      });
    });
  }, 1000);
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
  logger.debug(`Campaigns: Checking if we should prompt campaign ${campaignKey}`);

  const isPreviewing = actionsArray.some((action: ActionObj) => action.fn === 'isPreviewing');
  const hasShown = remotePromoSheetsStore.getState().getSheet(id)?.hasBeenShown;

  // If the campaign has been viewed already or it's the first app launch, exit early
  if (hasShown && !isPreviewing) {
    logger.debug(`Campaigns: User has already been shown ${campaignKey}`);
    return false;
  }

  let shouldPrompt = true;

  for (const actionObj of actionsArray) {
    const { fn, outcome, props = {} } = actionObj;
    const action = __INTERNAL_ACTION_CHECKS[fn];
    if (typeof action === 'undefined') {
      continue;
    }

    logger.debug(`Campaigns: Checking action ${fn}`);
    const result = await action({ ...props, ...campaign });
    logger.debug(`Campaigns: [${fn}] matches desired outcome: => ${result === outcome}`);

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
