import { BalanceQueryStore, DepositConfig, WithdrawalConfig } from './types';

// ============ Config Helpers ================================================= //

/**
 * Identity function enabling type inference for deposit configs.
 *
 * @example
 * ```ts
 * export const MY_DEPOSIT_CONFIG = createDepositConfig({
 *   id: 'my-feature',
 *   to: { chainId: ChainId.polygon, token: { ... } },
 *   // Full type checking without explicit type annotation
 * });
 * ```
 */
export function createDepositConfig(config: DepositConfig): DepositConfig {
  return config;
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
