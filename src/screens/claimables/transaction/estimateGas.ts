import { CrosschainQuote, Quote } from '@rainbow-me/swaps';
import { getProvider } from '@/handlers/web3';
import { Address } from 'viem';
import { ChainId } from '@/state/backendNetworks/types';
import { estimateTransactionsGasLimit, populateSwap } from '@/raps/utils';
import { estimateApprove, needsTokenApproval, populateApprove } from '@/raps/actions/unlock';
import { logger, RainbowError } from '@/logger';
import { estimateSwapGasLimit } from '@/raps/actions/swap';

/**
 * Estimates the gas limit for claim + unlock + swap transactions using transaction simulation.
 */
export const estimateClaimUnlockSwap = async ({
  chainId,
  claim,
  quote,
}: {
  chainId: ChainId;
  claim: { data: string; to: string; from: string }[];
  quote: Quote | CrosschainQuote | undefined;
}): Promise<string | undefined> => {
  const steps: {
    transaction: { to: string; data: string; from: string; value: string };
    label: string;
    fallbackEstimate?: () => Promise<string | undefined>;
  }[] = claim.map(action => ({
    transaction: {
      to: action.to,
      data: action.data,
      from: action.from,
      value: '0x0',
    },
    label: 'claim',
  }));

  if (quote) {
    const { from: accountAddress, sellTokenAddress, allowanceNeeded, allowanceTarget, sellTokenAsset, sellAmount } = quote;
    const requiresApprove =
      allowanceNeeded &&
      (await needsTokenApproval({
        owner: accountAddress,
        tokenAddress: sellTokenAddress,
        spender: allowanceTarget as Address,
        amount: sellAmount.toString(),
        chainId,
      }));

    if (!sellTokenAsset) {
      logger.error(new RainbowError('[estimateClaimUnlockSwap]: Quote is missing sellTokenAsset'));
      return undefined;
    }

    const provider = getProvider({ chainId });

    if (requiresApprove) {
      const approveTransaction = await populateApprove({
        owner: accountAddress,
        tokenAddress: sellTokenAddress,
        spender: allowanceTarget as Address,
        chainId,
        amount: sellAmount.toString(),
      });

      if (approveTransaction?.to && approveTransaction?.data && approveTransaction?.from) {
        steps.push({
          transaction: {
            to: approveTransaction.to,
            data: approveTransaction.data,
            from: approveTransaction.from,
            value: approveTransaction.value?.toString() || '0x0',
          },
          label: 'approve',
          fallbackEstimate: () =>
            estimateApprove({
              owner: accountAddress,
              tokenAddress: sellTokenAddress,
              spender: allowanceTarget as Address,
              chainId,
            }),
        });
      } else {
        logger.error(new RainbowError('[estimateClaimUnlockSwap]: Failed to populate approve transaction'));
        return undefined;
      }
    }

    const swapTransaction = await populateSwap({
      provider,
      quote,
    });

    if (swapTransaction?.to && swapTransaction?.data && swapTransaction?.from) {
      steps.push({
        transaction: {
          to: swapTransaction.to,
          data: swapTransaction.data,
          from: swapTransaction.from,
          value: swapTransaction.value?.toString() || '0x0',
        },
        label: 'swap',
        fallbackEstimate: () =>
          estimateSwapGasLimit({
            chainId,
            requiresApprove,
            quote,
          }),
      });
    } else {
      logger.error(new RainbowError('[estimateClaimUnlockSwap]: Failed to populate swap transaction'));
      return undefined;
    }
  }

  return estimateTransactionsGasLimit({ chainId, steps });
};
