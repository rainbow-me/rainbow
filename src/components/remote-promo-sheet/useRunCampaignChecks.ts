import { useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { Navigation } from '@/navigation';
import { resolveFirstRejectLast } from '@/utils';
import Routes from '@/navigation/routesNames';
import { STORAGE_IDS } from '@/model/mmkv';
import store from '@/redux/store';
import {
  PromoSheetCollectionResult,
  usePromoSheetCollectionQuery,
} from '@/resources/promoSheet/promoSheetCollectionQuery';
import { logger } from '@/logger';
import { PromoSheet } from '@/graphql/__generated__/arc';

import * as fns from './check-fns';
import { REMOTE_PROMO_SHEETS, useExperimentalFlag } from '@/config';

const TIMEOUT_BETWEEN_PROMOS = 5 * 60 * 1000; // 5 minutes in milliseconds

const mmkv = new MMKV();

type ActionObj = {
  fn: Actions;
  outcome: boolean;
  props: any;
};
type ActionFn = (props: any) => boolean | Promise<boolean>;
type ActionProp = (campaign: PromoSheet, props: object) => Promise<object>;

export const enum Actions {
  hasSelectedWallet = 'hasSelectedWallet',
  isSelectedWalletReadyOnly = 'isSelectedWalletReadyOnly',
  hasNonZeroAssetBalance = 'hasNonZeroAssetBalance',
  isAfterCampaignLaunch = 'isAfterCampaignLaunch',
  hasNonZeroTotalBalance = 'hasNonZeroTotalBalance',
}

export type CampaignCheckResult = {
  campaignId: string;
  campaignKey: string;
};

const timeBetweenPromoSheets = () => {
  const lastPromoSheetShown = mmkv.getNumber(
    STORAGE_IDS.LAST_PROMO_SHEET_TIMESTAMP
  );
  if (!lastPromoSheetShown) return TIMEOUT_BETWEEN_PROMOS;

  return Date.now() - lastPromoSheetShown;
};

export const useRunCampaignChecks = () => {
  const remotePromoSheets = useExperimentalFlag(REMOTE_PROMO_SHEETS);

  const isPromoCurrentlyShown = mmkv.getBoolean(
    STORAGE_IDS.PROMO_CURRENTLY_SHOWN
  );

  const walletReady = store.getState().appState.walletReady;

  const { data, isLoading, error } = usePromoSheetCollectionQuery(
    {},
    {
      enabled:
        walletReady &&
        remotePromoSheets &&
        !isPromoCurrentlyShown &&
        timeBetweenPromoSheets() >= TIMEOUT_BETWEEN_PROMOS,
    }
  );

  useEffect(() => {
    if (walletReady && remotePromoSheets && !isLoading && !error && data) {
      runCampaignChecks(data.promoSheetCollection);
    }

    return () => {
      // when unloading this effect, we should reset the isPromoCurrentlyShown
      mmkv.set(STORAGE_IDS.PROMO_CURRENTLY_SHOWN, false);
    };
  }, [data, isLoading, error, remotePromoSheets, walletReady]);
};

export const runCampaignChecks = async (
  campaigns: PromoSheetCollectionResult['promoSheetCollection']
) => {
  logger.log('Campaigns: Running Checks');

  const campaignPromises = (campaigns?.items || [])
    .filter((campaign): campaign is PromoSheet => campaign !== null)
    .map(async campaign => await shouldPromptCampaign(campaign));

  // In order to save computational bandwidth, we will resolve with the first campaign that should be shown, disregarding all others
  const result = await resolveFirstRejectLast(campaignPromises);
  if (!result) {
    logger.info(`No campaign to prompt`);
    return;
  }

  logger.info(`Triggering campaign: ${result.campaignKey}`);

  triggerCampaign(result);
};

export const triggerCampaign = async ({
  campaignId,
  campaignKey,
}: CampaignCheckResult) => {
  logger.log(`Campaign: Showing ${campaignKey} Promo`);
  mmkv.set(campaignKey, true);

  setTimeout(() => {
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
  if (!campaignKey || !id || !actions.length) return;

  // sanity check to prevent showing a campaign twice to a user or potentially showing a campaign to a fresh user
  const hasViewedCampaign = mmkv.getBoolean(campaignKey as string);
  const firstLaunch = fns.isFirstLaunch(mmkv);

  logger.log(`Checking if we should prompt campaign ${campaignKey}`);
  logger.info(`Has Viewed Campaign: ${hasViewedCampaign}`);
  logger.info(`Is First Launch: ${firstLaunch}`);

  // If the campaign has been viewed already or it's the first app launch, exit early
  if (hasViewedCampaign || firstLaunch) {
    return;
  }

  const shouldPrompt = ((actions || []) as ActionObj[]).every(
    async ({ fn, outcome, props = {} }) => {
      const action = __INTERNAL_ACTION_CHECKS[fn];
      logger.info(`Checking action: ${fn}. Typeof action: ${typeof action}`);
      // We were passed an action we can't handle, so we return false
      if (typeof action === 'undefined') return false;

      const params = (await __INTERNAL_ACTION_PROPS[fn]?.(campaign, props)) || {
        ...campaign,
        ...props,
      };
      const result = await action({ ...params });

      logger.info(`[${fn}]: result ${result}`);
      return result === outcome;
    }
  );

  console.log({ shouldPrompt, campaignKey });

  // If any action check returns false, shouldPrompt will be false, so we won't show it.
  // Otherwise, if all action checks pass, we will show the promo to the user
  return shouldPrompt ? { campaignId: id, campaignKey } : undefined;
};

/**
 * A collection of internal functions used to check if a promo sheet campaign
 * should be shown.
 *
 * @returns boolean
 */
export const __INTERNAL_ACTION_CHECKS: { [key in Actions]: ActionFn } = {
  [Actions.hasSelectedWallet]: fns.hasSelectedWallet,
  [Actions.isSelectedWalletReadyOnly]: fns.isSelectedWalletReadyOnly,
  [Actions.hasNonZeroAssetBalance]: fns.hasNonZeroAssetBalance,
  [Actions.isAfterCampaignLaunch]: fns.isAfterCampaignLaunch,
  [Actions.hasNonZeroTotalBalance]: fns.hasNonZeroTotalBalance,
};

/**
 * A helper function to snag any props we might need for a specific ActionFn
 *
 * If the action isn't defined here, it doesn't have any specific props we need
 */
export const __INTERNAL_ACTION_PROPS: Partial<
  { [key in Actions]: ActionProp }
> = {};
