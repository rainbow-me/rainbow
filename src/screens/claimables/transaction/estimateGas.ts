import { CrosschainQuote, Quote } from '@rainbow-me/swaps';
import { getProvider } from '@/handlers/web3';
import { Address } from 'viem';
import { metadataPOSTClient } from '@/graphql';
import { ChainId } from '@/state/backendNetworks/types';
import { add, convertAmountToRawAmount, greaterThan } from '@/helpers/utilities';
import { populateSwap } from '@/raps/utils';
import { estimateApprove, getAssetRawAllowance, populateApprove } from '@/raps/actions/unlock';
import { isNativeAsset } from '@/handlers/assets';
import { ETH_ADDRESS } from '@/references';
import { logger, RainbowError } from '@/logger';
import { estimateSwapGasLimit } from '@/raps/actions/swap';

/**
 * Estimates the gas limit for claim + unlock + swap transactions using transaction simulation.
 */
export const estimateClaimUnlockSwapGasLimit = async ({
  chainId,
  claim,
  quote,
}: {
  chainId: ChainId;
  claim: { data: string; to: string; from: string };
  quote: Quote | CrosschainQuote | undefined;
}): Promise<string | undefined> => {
  const transactions: { to: string; data: string; from: string; value: string }[] = [
    {
      to: claim.to,
      data: claim.data,
      from: claim.from,
      value: '0x0',
    },
  ];

  let swapAssetNeedsUnlocking = false;

  if (quote) {
    const { from: accountAddress, sellTokenAddress, allowanceNeeded, allowanceTarget, sellTokenAsset, sellAmount } = quote;

    if (!sellTokenAsset) {
      logger.error(new RainbowError('[estimateClaimUnlockSwapGasLimit]: Quote is missing sellTokenAsset'));
      return undefined;
    }

    if (allowanceNeeded && !(isNativeAsset(sellTokenAddress, chainId) || sellTokenAddress === ETH_ADDRESS)) {
      const allowance = await getAssetRawAllowance({
        owner: accountAddress as Address,
        assetAddress: sellTokenAddress as Address,
        spender: allowanceTarget as Address,
        chainId,
      });

      const rawAmount = convertAmountToRawAmount(sellAmount.toString(), sellTokenAsset.decimals);
      swapAssetNeedsUnlocking = !greaterThan(allowance, rawAmount);
    }

    const provider = getProvider({ chainId });

    if (swapAssetNeedsUnlocking) {
      const approveTransaction = await populateApprove({
        owner: accountAddress as Address,
        tokenAddress: sellTokenAddress as Address,
        spender: allowanceTarget as Address,
        chainId,
      });

      if (approveTransaction?.to && approveTransaction?.data && approveTransaction?.from) {
        transactions.push({
          to: approveTransaction.to,
          data: approveTransaction.data,
          from: approveTransaction.from,
          value: approveTransaction.value?.toString() || '0x0',
        });
      } else {
        logger.error(new RainbowError('[estimateClaimUnlockSwapGasLimit]: Failed to populate approve transaction'));
        return undefined;
      }
    }

    const swapTransaction = await populateSwap({
      provider,
      quote,
    });

    if (swapTransaction?.to && swapTransaction?.data && swapTransaction?.from) {
      transactions.push({
        to: swapTransaction.to,
        data: swapTransaction.data,
        from: swapTransaction.from,
        value: swapTransaction.value?.toString() || '0x0',
      });
    } else {
      logger.error(new RainbowError('[estimateClaimUnlockSwapGasLimit]: Failed to populate swap transaction'));
      return undefined;
    }
  }

  try {
    const response = await metadataPOSTClient.simulateTransactions({
      chainId,
      transactions,
    });
    const gasEstimates = await Promise.all(
      response.simulateTransactions?.map(async (res, index) => {
        let step;
        if (index === 0) {
          step = 'claim';
        } else if (index === 1 && swapAssetNeedsUnlocking) {
          step = 'approval';
        } else {
          step = 'swap';
        }

        let gasEstimate = res?.gas?.estimate;

        if (!gasEstimate) {
          logger.warn(`[estimateClaimUnlockSwapGasLimit]: Failed to simulate ${step} transaction`, {
            message: res?.error?.message,
          });

          if (quote) {
            if (step === 'approval') {
              gasEstimate = await estimateApprove({
                owner: quote.from as Address,
                tokenAddress: quote.sellTokenAddress as Address,
                spender: quote.allowanceTarget as Address,
                chainId,
              });
            } else if (step === 'swap') {
              gasEstimate = await estimateSwapGasLimit({
                chainId,
                requiresApprove: swapAssetNeedsUnlocking,
                quote,
              });
            }
          }
        }

        if (!gasEstimate) {
          throw new Error(`Failed to estimate gas for ${step}`);
        }

        return gasEstimate;
      }) || []
    );

    const gasLimit = gasEstimates.reduce((acc, limit) => (acc && limit ? add(acc, limit) : acc), '0');

    return gasLimit;
  } catch (e) {
    logger.error(new RainbowError('[estimateClaimUnlockSwapGasLimit]: Failed to simulate transactions'), {
      message: (e as Error)?.message,
    });
  }
  return undefined;
};
