import { MMKV } from 'react-native-mmkv';
import { Campaign, CampaignKey } from './campaignChecks';
import { EthereumAddress } from '@/entities';

import networkInfo from '@/helpers/networkInfo';
import { Network } from '@/helpers/networkTypes';
import WalletTypes from '@/helpers/walletTypes';
import { RainbowWallet } from '@/model/wallet';
import { Navigation } from '@/navigation';
import { ethereumUtils, logger } from '@/utils';
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

    Navigation.handleAction(Routes.SWAPS_PROMO_SHEET, {});
  }, 1000);
};

export const swapsCampaignCheck = async (): Promise<boolean> => {
  const hasShownCampaign = mmkv.getBoolean(CampaignKey.swapsLaunch);

  // we only want to show this campaign once
  if (hasShownCampaign) return false;

  const {
    selected: currentWallet,
  }: {
    selected: RainbowWallet | undefined;
  } = store.getState().wallets;

  // if there's no wallet then stop
  if (!currentWallet) return false;

  const {
    accountAddress,
  }: { accountAddress: EthereumAddress } = store.getState().settings;

  // transactions are loaded from the current wallet
  const { transactions } = store.getState().data;

  // if the current wallet is read only then stop
  if (currentWallet.type === WalletTypes.readOnly) return false;

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
  if (!hasBalance) return false;

  const swapsLaunchDate = new Date('2022-07-26');
  let hasSwapped: boolean = false;
  let timeCheck: boolean = false;
  let index: number = 0;
  while (!hasSwapped && !timeCheck && index <= transactions.length - 1) {
    const currentTransaction = transactions[index];
    if (currentTransaction.minedAt) {
      const txDate = new Date(currentTransaction.minedAt * 1000);

      // we dont care about tx's before we launched swaps
      if (txDate < swapsLaunchDate) {
        timeCheck = true;
      }
    }
    if (currentTransaction.to === RAINBOW_ROUTER_ADDRESS) {
      hasSwapped = true;
    }
    index++;
  }
  // if they have not swapped yet, trigger campaign action
  if (!hasSwapped) {
    SwapPromoCampaign.action();
    return true;
  }
  return false;
};

export const SwapPromoCampaign: Campaign = {
  action: async () => await swapsCampaignAction(),
  campaignKey: CampaignKey.swapsLaunch,
  check: async () => await swapsCampaignCheck(),
};
