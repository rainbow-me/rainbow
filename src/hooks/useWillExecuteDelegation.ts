import { useWillDelegate } from '@rainbow-me/delegation';
import type { Address } from 'viem';
import { useIsHardwareWallet } from '@/state/wallets/walletsStore';

/**
 * Returns whether delegation is expected and executable for the current wallet.
 * Wraps `useWillDelegate` and returns `false` for hardware wallets.
 */
export function useWillExecuteDelegation(address: Address, chainId: number): boolean {
  const isHardwareWallet = useIsHardwareWallet();
  const willDelegate = useWillDelegate(address, chainId);
  return !isHardwareWallet && willDelegate;
}
