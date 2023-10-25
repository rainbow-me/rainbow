import { useEffect } from 'react';
import { MMKV } from 'react-native-mmkv';
import { EthereumAddress } from '@/entities';
import { Network } from '@/helpers/networkTypes';
import WalletTypes from '@/helpers/walletTypes';
import { Navigation } from '@/navigation';
import { ethereumUtils, resolveFirstRejectLast } from '@/utils';
import store from '@/redux/store';
import Routes from '@/navigation/routesNames';
import { STORAGE_IDS } from '@/model/mmkv';
import { RainbowNetworks } from '@/networks';
import {
  PromoSheetCollectionResult,
  usePromoSheetCollectionQuery,
} from '@/resources/promoSheet/promoSheetCollectionQuery';
import { logger } from '@/logger';
import { InteractionManager } from 'react-native';
import { PromoSheet } from '@/graphql/__generated__/arc';

const TIMEOUT_BETWEEN_PROMOS = 5 * 60 * 1000; // 5 minutes in milliseconds

const mmkv = new MMKV();

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
  const isPromoCurrentlyShown = mmkv.getBoolean(
    STORAGE_IDS.PROMO_CURRENTLY_SHOWN
  );

  console.log({ isPromoCurrentlyShown });

  const { data, isLoading, error } = usePromoSheetCollectionQuery(
    {},
    {
      enabled:
        !isPromoCurrentlyShown &&
        timeBetweenPromoSheets() >= TIMEOUT_BETWEEN_PROMOS,
    }
  );

  useEffect(() => {
    if (!isLoading && !error && data) {
      runCampaignChecks(data.promoSheetCollection);
    }

    return () => {
      // when unloading this effect, we should reset the isPromoCurrentlyShown
      mmkv.set(STORAGE_IDS.PROMO_CURRENTLY_SHOWN, false);
    };
  }, [data, isLoading, error]);
};

export const runCampaignChecks = async (
  campaigns: PromoSheetCollectionResult['promoSheetCollection']
) => {
  logger.log('Campaigns: Running Checks');

  const campaignPromises = (campaigns?.items || [])
    .filter((campaign): campaign is PromoSheet => campaign !== null)
    .map(async campaign => shouldPromptCampaign(campaign));

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

export const isSelectedWalletReadyOnly = (): boolean => {
  const { selected } = store.getState().wallets;

  // if no selected wallet, we will treat it as a read-only wallet
  if (!selected || selected.type === WalletTypes.readOnly) {
    return true;
  }

  return false;
};

export const hasNonZeroAssetBalance = async (
  assetAddress: EthereumAddress
): Promise<boolean> => {
  const { selected } = store.getState().wallets;
  if (!selected) return false;

  const { accountAddress } = store.getState().settings;

  const networks = RainbowNetworks.map(network => network.value);

  // check native asset balances on networks
  const balancePromises = networks.map(network =>
    ethereumUtils
      .getNativeAssetForNetwork(network, accountAddress)
      .then(nativeAsset => Number(nativeAsset?.balance?.amount) > 0)
      .catch(error => {
        console.error(`Failed to get balance for network ${network}: ${error}`);
        return false;
      })
  );

  for (const balancePromise of balancePromises) {
    // eslint-disable-next-line no-await-in-loop
    if (await balancePromise) {
      return true;
    }
  }

  return false;
};

export const hasSelectedWallet = (): boolean => {
  const { selected } = store.getState().wallets;
  return !!selected;
};

export const isFirstLaunch = (): boolean => {
  return mmkv.getBoolean(STORAGE_IDS.FIRST_APP_LAUNCH) ?? false;
};

export const isAfterCampaignLaunch = ({ launchDate }: PromoSheet): boolean => {
  return new Date() > launchDate;
};

export const hasNonZeroTotalBalance = async (): Promise<boolean> => {
  const {
    accountAddress,
  }: {
    accountAddress: EthereumAddress;
    network: Network;
  } = store.getState().settings;

  const networks: Network[] = RainbowNetworks.map(network => network.value);
  const balances = await Promise.all(
    networks.map(async network => {
      const nativeAsset = await ethereumUtils.getNativeAssetForNetwork(
        network,
        accountAddress
      );
      return Number(nativeAsset?.balance?.amount);
    })
  );

  return balances.some(balance => balance > 0);
};

type ActionObj = {
  fn: Actions;
  outcome: boolean;
  props: any;
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
  const firstLaunch = isFirstLaunch();

  logger.log(`Checking if we should prompt campaign ${campaignKey}`);
  logger.info(`Has Viewed Campaign: ${hasViewedCampaign}`);
  logger.info(`Is First Launch: ${firstLaunch}`);

  // If the campaign has been viewed already or it's the first app launch, exit early
  // if (hasViewedCampaign || firstLaunch) {
  //   return;
  // }

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
  [Actions.hasSelectedWallet]: hasSelectedWallet,
  [Actions.isFirstLaunch]: isFirstLaunch,
  [Actions.isSelectedWalletReadyOnly]: isSelectedWalletReadyOnly,
  [Actions.hasNonZeroAssetBalance]: hasNonZeroAssetBalance,
  [Actions.isAfterCampaignLaunch]: isAfterCampaignLaunch,
  [Actions.hasNonZeroTotalBalance]: hasNonZeroTotalBalance,
};

/**
 * A helper function to snag any props we might need for a specific ActionFn
 *
 * If the action isn't defined here, it doesn't have any specific props we need
 */
export const __INTERNAL_ACTION_PROPS: Partial<
  { [key in Actions]: ActionProp }
> = {};

type ActionFn = (props: any) => boolean | Promise<boolean>;
type ActionProp = (campaign: PromoSheet, props: object) => Promise<object>;

export const enum Actions {
  hasSelectedWallet = 'hasSelectedWallet',
  isFirstLaunch = 'isFirstLaunch',
  isSelectedWalletReadyOnly = 'isSelectedWalletReadyOnly',
  hasNonZeroAssetBalance = 'hasNonZeroAssetBalance',
  isAfterCampaignLaunch = 'isAfterCampaignLaunch',
  hasNonZeroTotalBalance = 'hasNonZeroTotalBalance',
}
