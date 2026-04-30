import { isPreparedCallsExecutionSponsored } from '@/features/delegation/calls';
import { type PreparedCallsStore } from '@/features/delegation/preparedCallsStore';
import { predictSponsoredCallsExecution } from '@/features/delegation/sponsoredCalls';
import * as i18n from '@/languages';
import { type DepositConfigInput } from '@/systems/funding/types';
import { time } from '@/utils/time';

import { RnbwStakingSubmitButton } from './components/RnbwStakingSubmitButton';
import { RNBW_DECIMALS, RNBW_TOKEN_ADDRESS, STAKING_CHAIN_ID } from './constants';
import { estimateStakeGasLimit } from './utils/estimateStakeGasLimit';
import { type PreparedStakeRnbw, type StakeRnbwPreparationParams } from './utils/prepareStakeRnbw';
import { refreshStakingData } from './utils/refreshStakingData';
import { stakeRnbw } from './utils/stakeRnbw';
import { buildSyntheticRnbwSourceAsset } from './utils/syntheticRnbwSourceAsset';

/**
 * Builds the RNBW staking deposit config.
 */
export function createRnbwStakingDepositConfig(
  stakePreparationStore: PreparedCallsStore<PreparedStakeRnbw, StakeRnbwPreparationParams>
): DepositConfigInput {
  return {
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

    execute: async ({ accountAddress, amount, asset, gasParams }) => {
      const preparedStake = stakePreparationStore
        .getState()
        .getPreparedCalls({ accountAddress, amount })
        .catch(() => null);

      const result = await stakeRnbw({ address: accountAddress, amount, asset, gasParams, preparedStake });

      return {
        confirmationChainId: STAKING_CHAIN_ID,
        executionStrategy: 'custom',
        isConfirmed: result.isConfirmed,
        success: true,
        waitForConfirmation: result.waitForConfirmation,
      };
    },

    gas: {
      estimateGasLimit: estimateStakeGasLimit,
      predictIsSponsored: ({ accountAddress }) => predictSponsoredCallsExecution({ address: accountAddress, chainId: STAKING_CHAIN_ID }),
      isSponsored: async params => {
        const preparedStake = await stakePreparationStore.getState().fetch(params);
        return isPreparedCallsExecutionSponsored(preparedStake?.preparedCalls ?? null);
      },
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
  };
}
