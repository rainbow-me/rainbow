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
import { analytics } from '@rainbow-me/analytics';
import store from '@rainbow-me/redux/store';
import Routes from '@rainbow-me/routes';

// Rainbow Router
const RAINBOW_ROUTER_ADDRESS: EthereumAddress =
  '0x00000000009726632680fb29d3f7a9734e3010e2';

const mmkv = new MMKV();

export const swapsCampaignAction = async () => {
  logger.log('Campaign: Showing Swaps Promo');

  mmkv.set(CampaignKey.swapsLaunch, true);
  setTimeout(() => {
    logger.log('triggering swap promo action');
    analytics.track('Presented Feature Promo', { campaign: 'swaps_launch' });

    Navigation.handleAction(Routes.SWAPS_PROMO_SHEET, {});
  }, 1000);
};

export type SwapPromoCampaignExclusions = 'no_assets' | 'already_swapped';

export const swapsCampaignCheck = async (): Promise<
  SwapPromoCampaignExclusions | GenericCampaignCheckResponse
> => {
  const hasShownCampaign = mmkv.getBoolean(CampaignKey.swapsLaunch);

  // we only want to show this campaign once
  if (hasShownCampaign) return GenericCampaignCheckResponse.nonstarter;

  const {
    selected: currentWallet,
  }: {
    selected: RainbowWallet | undefined;
  } = store.getState().wallets;

  // if there's no wallet then stop
  if (!currentWallet) return GenericCampaignCheckResponse.nonstarter;

  const {
    accountAddress,
  }: { accountAddress: EthereumAddress } = store.getState().settings;

  // transactions are loaded from the current wallet
  const { transactions } = store.getState().data;

  // if the current wallet is read only then stop
  if (currentWallet.type === WalletTypes.readOnly)
    return GenericCampaignCheckResponse.nonstarter;

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
  if (!hasBalance) return 'no_assets';

  const swapsLaunchDate = new Date('2022-07-26');
  const isAfterSwapsLaunch = (tx: RainbowTransaction): boolean => {
    if (tx.minedAt) {
      const txDate = new Date(tx.minedAt * 1000);
      return txDate > swapsLaunchDate;
    }
    return false;
  };

  const isSwapTx = (tx: RainbowTransaction): boolean => {
    if (tx.to === RAINBOW_ROUTER_ADDRESS) {
      return true;
    }
    return false;
  };

  const hasSwapped = !!transactions.filter(isAfterSwapsLaunch).find(isSwapTx);

  // if they have not swapped yet, trigger campaign action
  if (!hasSwapped) {
    SwapPromoCampaign.action();
    return GenericCampaignCheckResponse.activated;
  }
  return 'already_swapped';
};

export const SwapPromoCampaign: Campaign = {
  action: async () => await swapsCampaignAction(),
  campaignKey: CampaignKey.swapsLaunch,
  check: async () => await swapsCampaignCheck(),
  checkType: CampaignCheckType.deviceOrWallet,
};
