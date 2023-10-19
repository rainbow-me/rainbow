import { MMKV } from 'react-native-mmkv';
import { EthereumAddress, RainbowTransaction } from '@/entities';
import { Network } from '@/helpers/networkTypes';
import WalletTypes from '@/helpers/walletTypes';
import { RainbowWallet } from '@/model/wallet';
import { Navigation } from '@/navigation';
import { ethereumUtils, logger } from '@/utils';
import store from '@/redux/store';
import Routes from '@/navigation/routesNames';
import { STORAGE_IDS } from '@/model/mmkv';
import { RainbowNetworks } from '@/networks';

const mmkv = new MMKV();

export const triggerCampaign = async (campaignKey: string) => {
  logger.log(`Campaign: Showing ${campaignKey} Promo`);
  mmkv.set(campaignKey, true);

  setTimeout(() => {
    logger.log('nagivation to promo sheet triggered');

    Navigation.handleAction(Routes.PROMO_SHEET, {
      campaignKey,
    });
  }, 1000);
};

export const isSelectedWalletReadOnly = (): boolean => {
  const { selected } = store.getState().wallets;
  if (!selected) return false;

  return selected.type === WalletTypes.readOnly;
};

export const hasNonZeroAssetBalance = async (
  assetAddress: EthereumAddress
): Promise<boolean> => {
  return false;
};

export const noCurrentWallet = (): boolean => {
  const { selected } = store.getState().wallets;
  return !selected;
};

export const isFirstLaunch = (): boolean => {
  return mmkv.getBoolean(STORAGE_IDS.FIRST_APP_LAUNCH) ?? false;
};

type IsAfterCampaignLaunchProps = {
  campaignLaunchDate: Date;
};

export const isAfterCampaignLaunch = ({
  campaignLaunchDate,
}: IsAfterCampaignLaunchProps): boolean => {
  return new Date() > campaignLaunchDate;
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

export const shouldPromptCampaign = async (
  campaignKey: string,
  actions: Actions[]
): Promise<boolean> => {
  const hasViewedCampaign = mmkv.getBoolean(campaignKey);
  const isFirstLaunch = mmkv.getBoolean(STORAGE_IDS.FIRST_APP_LAUNCH);

  // If the campaign has been viewed already or it's the first app launch, return false
  if (hasViewedCampaign || isFirstLaunch) {
    return false;
  }

  const shouldPrompt = Object.values(actions).some(async key => {
    const action = __INTERNAL_ACTION_CHECKS[key];
    // We were passed an action we can't handle, so we return false
    if (typeof action === 'undefined') return false;

    const props = (await __INTERNAL_ACTION_PROPS[key]?.(campaignKey)) || {};
    const result = await action({ ...props });
    return result === false;
  });

  // If any action returns false, shouldPrompt will be true, so we return the opposite
  return !shouldPrompt;
};

export const enum Actions {
  isSelectedWalletReadOnly = 'isSelectedWalletReadOnly',
  hasNonZeroAssetBalance = 'hasNonZeroAssetBalance',
  noCurrentWallet = 'noCurrentWallet',
  isFirstLaunch = 'isFirstLaunch',
  isAfterCampaignLaunch = 'isAfterCampaignLaunch',
  hasNonZeroTotalBalance = 'hasNonZeroTotalBalance',
}

type ActionFn = (props: object) => boolean | Promise<boolean>;

type ActionProp = null | ((campaignKey: string) => Promise<object>);

export const __INTERNAL_ACTION_PROPS: { [key in Actions]: ActionProp } = {
  [Actions.isAfterCampaignLaunch]: async (campaignKey: string) => {
    // TODO: get campaign launch date from somewhere here?

    return {
      campaignLaunchDate: new Date(),
    };
  },
  [Actions.hasNonZeroTotalBalance]: null,
  [Actions.isSelectedWalletReadOnly]: null,
};

export const __INTERNAL_ACTION_CHECKS: { [key in Actions]: ActionFn } = {
  [Actions.noCurrentWallet]: noCurrentWallet,
  [Actions.isFirstLaunch]: isFirstLaunch,
  [Actions.isAfterCampaignLaunch]: isAfterCampaignLaunch,
  [Actions.hasNonZeroTotalBalance]: hasNonZeroTotalBalance,
  [Actions.isSelectedWalletReadOnly]: isSelectedWalletReadOnly,
};
