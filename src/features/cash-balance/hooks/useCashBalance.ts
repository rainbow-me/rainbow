import { createDerivedStore } from '@storesjs/stores';

import { getUniqueId } from '@/entities/assetId';
import { CASH_USDC_BY_NETWORK } from '@/features/cash/constants';
import { RampNetwork } from '@/features/cash/services/rampClient';
import { convertAmountToNativeDisplayWorklet } from '@/features/currency/utils/nativeDisplay';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

const BASE_USDC = CASH_USDC_BY_NETWORK[RampNetwork.Base];
const BASE_USDC_ID = getUniqueId(BASE_USDC.address, BASE_USDC.chainId);

export const useCashBalance = createDerivedStore<string>(
  $ => {
    const asset = $(useUserAssetsStore, state => state.getUserAsset(BASE_USDC_ID));
    const currency = $(userAssetsStoreManager, state => state.currency);

    return asset?.native.balance.display ?? convertAmountToNativeDisplayWorklet(0, currency);
  },
  { lockDependencies: true }
);
