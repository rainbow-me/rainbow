import {
  add,
  convertAmountToNativeDisplayWorklet,
  convertRawAmountToDecimalFormat,
  greaterThanOrEqualTo,
  isPositive,
} from '@/helpers/utilities';
import { useRewardsBalanceStore } from '@/features/rnbw-rewards/stores/rewardsBalanceStore';
import { MIN_CLAIM_TO_STAKING_RAW, RNBW_DECIMALS, RNBW_TOKEN_UNIQUE_ID } from '@/features/rnbw-staking/constants';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual } from '@/worklets/comparisons';
import { toFixedWorklet } from '@/framework/core/safeMath';
import { formatNumber } from '@/helpers/strings';

const MIN_STAKE_AMOUNT = convertRawAmountToDecimalFormat(MIN_CLAIM_TO_STAKING_RAW, RNBW_DECIMALS);

type RnbwBalance = {
  walletBalance: string;
  claimableBalance: string;
  tokenAmountFormatted: string;
  nativeCurrencyAmount: string;
  hasBalance: boolean;
  hasMinimumStakeAmount: boolean;
};

export const useStakableRnbwBalance = createDerivedStore<RnbwBalance>(
  $ => {
    const asset = $(useUserAssetsStore, state => state.getUserAsset(RNBW_TOKEN_UNIQUE_ID));
    const rewardsData = $(useRewardsBalanceStore, state => state.getData());
    const currency = $(userAssetsStoreManager, state => state.currency);

    const walletAmount = asset?.balance?.amount ?? '0';
    const walletNativeValue = asset?.native?.balance?.amount ?? '0';

    const claimableRaw = rewardsData?.claimableRnbw ?? '0';
    const claimableAmount = convertRawAmountToDecimalFormat(claimableRaw, RNBW_DECIMALS);
    const claimableNativeValue = rewardsData?.claimableValueInCurrency ?? '0';

    const totalAmount = add(walletAmount, claimableAmount);
    const totalNativeValue = add(walletNativeValue, claimableNativeValue);
    const hasBalance = isPositive(totalAmount);

    return {
      walletBalance: walletAmount,
      claimableBalance: claimableAmount,
      tokenAmountFormatted: formatNumber(toFixedWorklet(totalAmount, 2)),
      nativeCurrencyAmount: convertAmountToNativeDisplayWorklet(totalNativeValue, currency, hasBalance),
      hasBalance,
      hasMinimumStakeAmount: greaterThanOrEqualTo(totalAmount, MIN_STAKE_AMOUNT),
    };
  },
  { equalityFn: shallowEqual, fastMode: true }
);
