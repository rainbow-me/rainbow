import { MMKV } from 'react-native-mmkv';
import {
  Campaign,
  CampaignCheckType,
  CampaignKey,
  GenericCampaignCheckResponse,
} from './campaignChecks';
import { EthereumAddress, RainbowTransaction } from '@/entities';
import networkInfo from '@/helpers/networkInfo';
import { Network } from '@/helpers/networkTypes';
import WalletTypes from '@/helpers/walletTypes';
import { RainbowWallet } from '@/model/wallet';
import { Navigation } from '@/navigation';
import { ethereumUtils, logger } from '@/utils';
import store from '@/redux/store';
import Routes from '@/navigation/routesNames';
import { STORAGE_IDS } from '@/model/mmkv';

// Rainbow Router
const RAINBOW_ROUTER_ADDRESS: EthereumAddress =
  '0x00000000009726632680fb29d3f7a9734e3010e2';

const swapsLaunchDate = new Date('2022-07-26');
const isAfterSwapsLaunch = (tx: RainbowTransaction): boolean => {
  if (tx.minedAt) {
    const txDate = new Date(tx.minedAt * 1000);
    return txDate > swapsLaunchDate;
  }
  return false;
};

const isSwapTx = (tx: RainbowTransaction): boolean =>
  tx?.to?.toLowerCase() === RAINBOW_ROUTER_ADDRESS;

const mmkv = new MMKV();

export const swapsCampaignAction = async () => {
  logger.log('Campaign: Showing Swaps Promo');

  mmkv.set(CampaignKey.swapsLaunch, true);
  setTimeout(() => {
    logger.log('triggering swaps promo action');

    Navigation.handleAction(Routes.SWAPS_PROMO_SHEET, {});
  }, 1000);
};

export enum SwapsPromoCampaignExclusion {
  noAssets = 'no_assets',
  alreadySwapped = 'already_swapped',
  wrongNetwork = 'wrong_network',
}

export const swapsCampaignCheck = async (): Promise<
  SwapsPromoCampaignExclusion | GenericCampaignCheckResponse
> => {
  const hasShownCampaign = mmkv.getBoolean(CampaignKey.swapsLaunch);
  const isFirstLaunch = mmkv.getBoolean(STORAGE_IDS.FIRST_APP_LAUNCH);

  const {
    selected: currentWallet,
  }: {
    selected: RainbowWallet | undefined;
  } = store.getState().wallets;

  /**
   * stop if:
   * there's no wallet
   * the current wallet is read only
   * the campaign has already been activated
   * the user is launching Rainbow for the first time
   */
  if (
    !currentWallet ||
    currentWallet.type === WalletTypes.readOnly ||
    isFirstLaunch ||
    hasShownCampaign
  ) {
    return GenericCampaignCheckResponse.nonstarter;
  }

  const {
    accountAddress,
    network: currentNetwork,
  }: {
    accountAddress: EthereumAddress;
    network: Network;
  } = store.getState().settings;

  if (currentNetwork !== Network.mainnet)
    return SwapsPromoCampaignExclusion.wrongNetwork;
  // transactions are loaded from the current wallet
  const { transactions } = store.getState().data;

  const networks: Network[] = (Object.keys(networkInfo) as Network[]).filter(
    (network: any): boolean => networkInfo[network].exchange_enabled
  );

  // check native asset balances on networks that support swaps
  let hasBalance = false;
  await networks.forEach(async (network: Network) => {
    const nativeAsset = await ethereumUtils.getNativeAssetForNetwork(
      network,
      accountAddress
    );
    const balance = Number(nativeAsset?.balance?.amount);
    if (balance > 0) {
      hasBalance = true;
    }
  });

  // if the wallet has no native asset balances then stop
  if (!hasBalance) return SwapsPromoCampaignExclusion.noAssets;

  const hasSwapped = !!transactions.filter(isAfterSwapsLaunch).find(isSwapTx);

  // if they have not swapped yet, trigger campaign action
  if (!hasSwapped) {
    SwapsPromoCampaign.action();
    return GenericCampaignCheckResponse.activated;
  }
  return SwapsPromoCampaignExclusion.alreadySwapped;
};

export const SwapsPromoCampaign: Campaign = {
  action: async () => await swapsCampaignAction(),
  campaignKey: CampaignKey.swapsLaunch,
  check: async () => await swapsCampaignCheck(),
  checkType: CampaignCheckType.deviceOrWallet,
};
