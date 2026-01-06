import { Quote } from '@rainbow-me/swaps';
import { DepositConfig } from '../types';

// ============ Execution Strategy Types ====================================== //

export type SwapStrategy = {
  rapType: 'crosschainSwap' | 'swap';
  type: 'swap';
};

export type DirectTransferStrategy = {
  recipient: string;
  type: 'directTransfer';
};

export type ExecutionStrategy = DirectTransferStrategy | SwapStrategy;

// ============ Strategy Determination ======================================== //

export function determineStrategy(config: DepositConfig, quote: Quote, walletAddress: string): ExecutionStrategy {
  const isSameChain = Number(quote.chainId) === config.to.chainId;
  const isSameToken = quote.sellTokenAddress.toLowerCase() === config.to.token.address.toLowerCase();
  const isSameAsset = isSameChain && isSameToken;

  if (isSameAsset && config.directTransferEnabled) {
    const recipient = config.to.recipient?.getState() ?? walletAddress;
    if (!recipient) {
      throw new Error('Recipient required for direct transfer');
    }
    return { recipient, type: 'directTransfer' };
  }

  return {
    rapType: isSameChain ? 'swap' : 'crosschainSwap',
    type: 'swap',
  };
}
