import { analytics } from '@/analytics';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { createWithdrawalConfig } from '@/systems/funding/config';
import { type WithdrawalExecutionResult, type WithdrawalExecutorParams } from '@/systems/funding/types';
import { time } from '@/utils/time';
import { USD_DECIMALS } from './constants';
import { getHyperliquidExchangeClient } from './services';
import { useHyperliquidAccountStore } from './stores/hyperliquidAccountStore';
import { refetchHyperliquidBalance } from './utils';

// ============ Config ========================================================= //

export const PERPS_WITHDRAWAL_CONFIG = createWithdrawalConfig({
  id: 'perpsWithdrawal',
  amountDecimals: USD_DECIMALS,
  balanceStore: useHyperliquidAccountStore,
  executor: executePerpsWithdrawal,

  infoCard: {
    description: i18n.t(i18n.l.perps.withdraw.info_card_subtitle),
    title: {
      highlighted: i18n.t(i18n.l.perps.withdraw.info_card_title_suffix),
      prefix: i18n.t(i18n.l.perps.withdraw.info_card_title_prefix),
    },
  },

  refresh: {
    delays: [time.seconds(1), time.seconds(3), time.seconds(6)],
    handler: refetchHyperliquidBalance,
  },
});

// ============ Executor ======================================================= //

async function executePerpsWithdrawal(params: WithdrawalExecutorParams): Promise<WithdrawalExecutionResult> {
  const { amount } = params;

  try {
    await getHyperliquidExchangeClient().withdraw(amount);

    analytics.track(analytics.event.perpsWithdrew, {
      amount: Number(amount),
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(new RainbowError('[perpsWithdrawal]: withdrawal failed'), { error });

    analytics.track(analytics.event.perpsWithdrawFailed, {
      amount: Number(amount),
      errorMessage: message,
    });

    return { error: message, success: false };
  }
}
