import { delegation, useWillDelegate } from '@rainbow-me/delegation';
import { type Address } from 'viem';
import { getWalletWithAccount, useIsHardwareWallet } from '@/state/wallets/walletsStore';
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
 * Check whether delegation is expected and executable for the provided
 * `{ address, chainId }` params.
 *
 * @returns
 * ```ts
 * { willDelegate: boolean, delegation: DelegationData | null }
 * ```
 */
export async function willExecuteDelegation(params: WillExecuteDelegationParams): Promise<WillExecuteDelegationResult> {
  const isHardwareWallet = Boolean(getWalletWithAccount(params.address)?.deviceId);

  if (isHardwareWallet || !isDelegationEnabled()) {
    return WILL_NOT_DELEGATE;
  }

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
  const isHardwareWallet = useIsHardwareWallet();
  const delegationEnabled = useIsDelegationEnabled();
  const sdkWillDelegate = useWillDelegate(address, chainId);

  if (isHardwareWallet || !delegationEnabled) return false;

  return sdkWillDelegate;
}
