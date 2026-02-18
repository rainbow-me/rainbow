import { createNewAction, createNewRap } from './common';
import { RapAction, RapSwapActionParameters } from './references';
import { logger, RainbowError } from '@/logger';
import { needsTokenApproval } from './actions/unlock';
import { isCrosschainQuote } from '@/__swaps__/utils/quotes';
import { getQuoteAllowanceTargetAddress } from './validation';

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

  const { from: accountAddress, sellTokenAddress, allowanceNeeded } = quote;
  const allowanceTargetAddress = allowanceNeeded ? getQuoteAllowanceTargetAddress(quote) : null;
  const requiresApprove = allowanceTargetAddress
    ? await needsTokenApproval({
        owner: accountAddress,
        tokenAddress: sellTokenAddress,
        spender: allowanceTargetAddress,
        amount: sellAmount,
        chainId,
      })
    : false;

  if (requiresApprove && allowanceTargetAddress) {
    const unlock = createNewAction('unlock', {
      fromAddress: accountAddress,
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
