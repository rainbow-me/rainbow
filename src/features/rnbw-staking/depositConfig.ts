import { createDepositConfig } from '@/systems/funding/config';
import { time } from '@/utils/time';
import { RnbwStakingSubmitButton } from './components/RnbwStakingSubmitButton';
import { RNBW_DECIMALS, RNBW_TOKEN_ADDRESS, STAKING_CHAIN_ID } from './constants';
import { estimateStakeGasLimit } from './utils/estimateStakeGasLimit';
import { refreshStakingData } from './utils/refreshStakingData';
import { stakeRnbw } from './utils/stakeRnbw';
import { canUseSponsoredRnbwStaking } from './utils/canUseSponsoredRnbwStaking';
import { buildSyntheticRnbwSourceAsset } from './utils/syntheticRnbwSourceAsset';
import * as i18n from '@/languages';

export const RNBW_STAKING_DEPOSIT_CONFIG = createDepositConfig({
  id: 'rnbwStakingDeposit',
  directTransferEnabled: true,
  initialSliderProgress: 100,
  hideReceiveAmount: true,

  source: {
    mode: 'fixed',
    resolveAsset: () => buildSyntheticRnbwSourceAsset({ includeRewardsBalance: true }),
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
    confirmButton: i18n.t(i18n.l.rnbw_staking.deposit.confirm_button),
    confirmButtonError: i18n.t(i18n.l.rnbw_staking.deposit.confirm_button_error),
    confirmButtonLoading: i18n.t(i18n.l.rnbw_staking.deposit.confirm_button_loading),
    confirmButtonOverBalance: i18n.t(i18n.l.rnbw_staking.deposit.confirm_button_over_balance),
    confirmButtonZeroAmount: i18n.t(i18n.l.rnbw_staking.deposit.confirm_button_zero_amount),
    executionErrorTitle: i18n.t(i18n.l.rnbw_staking.deposit.execution_error_title),
    insufficientGas: i18n.t(i18n.l.rnbw_staking.deposit.insufficient_gas),
    quoteError: i18n.t(i18n.l.rnbw_staking.deposit.quote_error),
    receive: i18n.t(i18n.l.rnbw_staking.deposit.receive),
    title: i18n.t(i18n.l.rnbw_staking.deposit.title),
  },

  submitButtonComponent: RnbwStakingSubmitButton,

  validation: {
    minAmount: { label: i18n.t(i18n.l.rnbw_staking.deposit.minimum_amount), value: '1' },
  },

  refresh: {
    delays: [0, time.seconds(3), time.seconds(8)],
    handler: refreshStakingData,
  },
});
