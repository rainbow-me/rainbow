import * as i18n from '@/languages';
import { INITIAL_SLIDER_PROGRESS } from './constants';
import { type BalanceQueryStore, type DepositConfig, type DepositConfigInput, type DepositLabels, type WithdrawalConfig } from './types';

// ============ Config Helpers ================================================= //

function getDefaultDepositLabels(): DepositLabels {
  return {
    confirmButton: i18n.t(i18n.l.perps.deposit.confirm_button_text),
    confirmButtonError: i18n.t(i18n.l.perps.deposit.confirm_button_error_text),
    confirmButtonLoading: i18n.t(i18n.l.perps.deposit.confirm_button_loading_text),
    confirmButtonOverBalance: i18n.t(i18n.l.perps.deposit.confirm_button_over_balance_text),
    confirmButtonZeroAmount: i18n.t(i18n.l.perps.deposit.confirm_button_zero_text),
    executionErrorTitle: i18n.t(i18n.l.swap.error_executing_swap),
    gasSponsored: 'Free',
    insufficientGas: i18n.t(i18n.l.perps.deposit.insufficient_gas),
    invalidRouteRecipientError: 'Bridge route is not targeting your account. Please retry.',
    missingRecipientError: 'Missing recipient address',
    quoteError: i18n.t(i18n.l.perps.deposit.quote_error),
    receive: i18n.t(i18n.l.perps.deposit.receive),
    title: i18n.t(i18n.l.perps.deposit.title),
  };
}

/**
 * Creates a fully resolved deposit config from partial input.
 * Fills in default labels, normalizes source and gas config.
 *
 * @example
 * ```ts
 * export const MY_DEPOSIT_CONFIG = createDepositConfig({
 *   id: 'my-feature',
 *   to: { chainId: ChainId.polygon, token: { ... } },
 * });
 * ```
 */
export function createDepositConfig(config: DepositConfigInput): DepositConfig {
  return {
    ...config,
    gas: config.gas,
    hideReceiveAmount: config.hideReceiveAmount ?? false,
    initialSliderProgress: config.initialSliderProgress ?? INITIAL_SLIDER_PROGRESS,
    labels: {
      ...getDefaultDepositLabels(),
      ...config.labels,
    },
    source:
      config.source?.mode === 'fixed'
        ? {
            mode: 'fixed',
            resolveAsset: config.source.resolveAsset,
          }
        : { mode: 'selectable' },
  };
}

/**
 * Identity function enabling type inference for withdrawal configs.
 * Infers the balance store type from the `balanceStore` property.
 *
 * @example
 * ```ts
 * export const MY_WITHDRAWAL_CONFIG = createWithdrawalConfig({
 *   id: 'my-feature',
 *   balanceStore: useMyBalanceStore,
 *   // Generic inferred from balanceStore — no explicit type annotation needed
 * });
 * ```
 */
export function createWithdrawalConfig<T extends BalanceQueryStore>(config: WithdrawalConfig<T>): WithdrawalConfig<T> {
  return config;
}
