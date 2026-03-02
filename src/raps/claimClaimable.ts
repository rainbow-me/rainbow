import { createNewAction, createNewRap } from './common';
import { type RapAction, type RapSwapActionParameters } from './references';
import { logger, RainbowError } from '@/logger';
import { isCrosschainQuote } from '@/__swaps__/utils/quotes';
import { resolveApprovalRequirement } from './approval';

export async function createClaimClaimableRap(parameters: RapSwapActionParameters<'claimClaimable'>) {
  let actions: RapAction<'claimClaimable' | 'crosschainSwap' | 'unlock' | 'swap'>[] = [];

  const { sellAmount, assetToBuy, quote, chainId, assetToSell, meta, gasFeeParamsBySpeed, gasParams, additionalParams } = parameters;

  if (!additionalParams?.claimTxns.length) {
    logger.error(new RainbowError('[raps/claimClaimable]: claimTxns is undefined'));
    return { actions: [] };
  }

  for (const claimTx of additionalParams.claimTxns) {
    const claim = createNewAction('claimClaimable', {
      claimTx,
      asset: assetToSell,
    });
    actions = actions.concat(claim);
  }

  const { allowanceTargetAddress, requiresApprove } = await resolveApprovalRequirement({
    quote,
    chainId,
    sellAmount,
  });

  if (requiresApprove && allowanceTargetAddress) {
    const unlock = createNewAction('unlock', {
      fromAddress: quote.from,
      assetToUnlock: assetToSell,
      chainId,
      contractAddress: allowanceTargetAddress,
      amount: sellAmount,
    });
    actions = actions.concat(unlock);
  }

  if (!isCrosschainQuote(quote)) {
    // create a swap rap
    const swap = createNewAction('swap', {
      chainId: chainId,
      requiresApprove,
      quote,
      meta: meta,
      assetToSell,
      sellAmount,
      assetToBuy,
      gasParams,
      gasFeeParamsBySpeed,
    });
    actions = actions.concat(swap);
  } else {
    // create a crosschain swap rap
    const crosschainSwap = createNewAction('crosschainSwap', {
      chainId: chainId,
      requiresApprove,
      quote: quote,
      meta: meta,
      assetToSell,
      sellAmount,
      assetToBuy,
      gasParams,
      gasFeeParamsBySpeed,
    });
    actions = actions.concat(crosschainSwap);
  }

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
}
