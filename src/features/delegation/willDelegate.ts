import { delegation, useWillDelegate } from '@rainbow-me/delegation';
import { type Address } from 'viem';
import WalletTypes from '@/helpers/walletTypes';
import { type RainbowWallet } from '@/model/wallet';
import { getWalletWithAccount, useWalletsStore } from '@/state/wallets/walletsStore';
import { isDelegationEnabled, useIsDelegationEnabled } from './featureFlags';

// ============ Constants ====================================================== //

export type WillExecuteDelegationParams = Parameters<typeof delegation.willDelegate>[0];
export type WillExecuteDelegationResult = Awaited<ReturnType<typeof delegation.willDelegate>>;

const WILL_NOT_DELEGATE: WillExecuteDelegationResult = Object.freeze({
  willDelegate: false,
  delegation: null,
});

// ============ Delegation API ================================================= //

/**
 * Returns true when Rainbow can execute delegation-backed flows for `address`.
 */
export function canUseDelegatedExecution(address: Address): boolean {
  if (!isDelegationEnabled()) return false;

  return canUseDelegatedWallet(getWalletWithAccount(address));
}

/**
 * Check whether exact-call execution can use delegation for the provided
 * `{ address, chainId }` params.
 */
export async function supportsDelegatedExecution(params: WillExecuteDelegationParams): Promise<boolean> {
  if (!canUseDelegatedExecution(params.address)) return false;

  const support = await delegation.isSupported(params);
  return support.supported;
}

/**
 * Check whether delegation is expected and executable for the provided
 * `{ address, chainId }` params.
 *
 * @returns
 * ```ts
 * { willDelegate: boolean, delegation: DelegationData | null }
 * ```
 */
export async function willExecuteDelegation(params: WillExecuteDelegationParams): Promise<WillExecuteDelegationResult> {
  if (!canUseDelegatedExecution(params.address)) return WILL_NOT_DELEGATE;

  return delegation.willDelegate(params);
}

/**
 * Wraps the `useWillDelegate` hook from `@rainbow-me/delegation` with
 * feature flag and hardware wallet gates.
 *
 * Returns `true` if delegation is expected and executable for the
 * specified `(address, chainId)`.
 */
export function useWillExecuteDelegation(address: Address, chainId: number): boolean {
  const delegationEnabled = useIsDelegationEnabled();
  const wallet = useWalletsStore(s => s.getWalletWithAccount(address));
  const sdkWillDelegate = useWillDelegate(address, chainId);

  const canUseDelegation = delegationEnabled && canUseDelegatedWallet(wallet);
  if (!canUseDelegation) return false;

  return sdkWillDelegate;
}

function canUseDelegatedWallet(wallet: RainbowWallet | undefined): boolean {
  return wallet !== undefined && !wallet.deviceId && wallet.type !== WalletTypes.readOnly;
}
