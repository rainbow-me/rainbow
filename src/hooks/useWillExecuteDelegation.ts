import { useWillDelegate } from '@rainbow-me/delegation';
import type { Address } from 'viem';
import { DELEGATION, useExperimentalFlag } from '@/config';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useIsHardwareWallet } from '@/state/wallets/walletsStore';

/**
 * Returns whether delegation is expected and executable for the current wallet.
 * Wraps `useWillDelegate` and returns `false` for hardware wallets.
 */
export function useWillExecuteDelegation(address: Address, chainId: number): boolean {
  const localDelegationEnabled = useExperimentalFlag(DELEGATION);
  const remoteDelegationEnabled = useRemoteConfig('delegation_enabled').delegation_enabled;
  const isHardwareWallet = useIsHardwareWallet();

  const willDelegate = useWillDelegate(address, chainId);

  if (isHardwareWallet) return false;
  if (!localDelegationEnabled && !remoteDelegationEnabled) return false;

  return willDelegate;
}
