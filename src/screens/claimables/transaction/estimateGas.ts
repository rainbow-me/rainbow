import { CrosschainQuote, Quote, getRainbowRouterContractAddress } from '@rainbow-me/swaps';
import { getProvider } from '@/handlers/web3';
import { Address } from 'viem';
import { metadataPOSTClient } from '@/graphql';
import { ChainId } from '@/chains/types';
import { add, convertAmountToRawAmount, greaterThan } from '@/helpers/utilities';
import { populateSwap } from '@/raps/utils';
import { getAssetRawAllowance, populateApprove } from '@/raps/actions/unlock';
import { isNativeAsset } from '@/handlers/assets';
import { ETH_ADDRESS } from '@/references';
import { logger, RainbowError } from '@/logger';
import { Transaction } from '@/graphql/__generated__/simulation';

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
  const transactions: Transaction[] = [
    {
      to: claim.to,
      data: claim.data,
      from: claim.to,
      value: '0x0',
    },
  ];

  if (quote) {
    const { from: accountAddress, sellTokenAddress, allowanceNeeded, sellTokenAsset, sellAmount } = quote;

    if (!sellTokenAsset) {
      logger.error(new RainbowError('[estimateClaimUnlockSwapGasLimit]: Quote is missing sell token asset'));
      return undefined;
    }

    const spender = getRainbowRouterContractAddress(chainId as number);

    let swapAssetNeedsUnlocking = false;

    if (allowanceNeeded && !(isNativeAsset(sellTokenAddress, chainId) || sellTokenAddress === ETH_ADDRESS)) {
      const allowance = await getAssetRawAllowance({
        owner: accountAddress as Address,
        assetAddress: sellTokenAddress as Address,
        spender,
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
        spender,
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
    const gasLimit = response.simulateTransactions
      ?.map(res => res?.gas?.estimate)
      .reduce((acc, limit) => (acc && limit ? add(acc, limit) : acc), '0');
    return gasLimit;
  } catch (e) {
    logger.error(new RainbowError('[estimateClaimUnlockSwapGasLimit]: Failed to simulate transactions'), {
      message: (e as Error)?.message,
    });
  }
  return undefined;
};
