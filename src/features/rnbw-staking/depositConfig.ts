import { useRewardsBalanceStore } from '@/features/rnbw-rewards/stores/rewardsBalanceStore';
import { createDepositConfig } from '@/systems/funding/config';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { time } from '@/utils/time';
import { RNBW_DECIMALS, RNBW_TOKEN_ADDRESS, RNBW_TOKEN_UNIQUE_ID, STAKING_CHAIN_ID } from './constants';
import { estimateStakeGasLimit } from './utils/estimateStakeGasLimit';
import { refreshStakingData } from './utils/refreshStakingData';
import { stakeRnbw } from './utils/stakeRnbw';
import { canUseSponsoredRnbwStaking } from './utils/canUseSponsoredRnbwStaking';
import { buildSyntheticRnbwSourceAsset, getInitialSyntheticRnbwSourceUnitPrice } from './utils/syntheticRnbwSourceAsset';

export const RNBW_STAKING_DEPOSIT_CONFIG = createDepositConfig({
  id: 'rnbwStakingDeposit',
  directTransferEnabled: true,
  initialSliderProgress: 100,
  hideReceiveAmount: true,

  source: {
    mode: 'fixed',
    resolveAsset: () => {
      const rewardsData = useRewardsBalanceStore.getState().getData();

      return buildSyntheticRnbwSourceAsset({
        claimableRnbwRaw: rewardsData?.claimableRnbw ?? '0',
        hasPendingClaim: rewardsData?.hasPendingClaim ?? false,
        unitPrice: getInitialSyntheticRnbwSourceUnitPrice(),
        walletAsset: useUserAssetsStore.getState().getUserAsset(RNBW_TOKEN_UNIQUE_ID),
      });
    },
  },

  to: {
    chainId: STAKING_CHAIN_ID,
    token: {
      address: RNBW_TOKEN_ADDRESS,
      decimals: RNBW_DECIMALS,
      symbol: 'RNBW',
    },
  },

  execute: async ({ accountAddress, amount }) => {
    await stakeRnbw({ address: accountAddress, amount });
    return {
      confirmationChainId: STAKING_CHAIN_ID,
      executionStrategy: 'custom',
      isConfirmed: true,
      success: true,
    };
  },

  gas: {
    estimateGasLimit: estimateStakeGasLimit,
    isSponsored: ({ accountAddress }) => canUseSponsoredRnbwStaking(accountAddress, STAKING_CHAIN_ID),
  },

  labels: {
    confirmButton: 'Hold to Stake',
    confirmButtonError: 'Unable to stake',
    confirmButtonLoading: 'Staking...',
    confirmButtonOverBalance: 'Insufficient RNBW',
    confirmButtonZeroAmount: 'Enter amount',
    executionErrorTitle: 'Error Staking',
    insufficientGas: 'Insufficient gas',
    quoteError: 'Unable to prepare stake',
    receive: 'Rewards will be automatically claimed',
    title: 'Stake $RNBW',
  },

  validation: {
    minAmount: { label: 'Minimum 1 RNBW', value: '1' },
  },

  refresh: {
    delays: [0, time.seconds(3), time.seconds(8)],
    handler: refreshStakingData,
  },
});
