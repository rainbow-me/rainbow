import { createNewAction, createNewRap } from './common';
import type { RapAction, RapSwapActionParameters, RapUnlockActionParameters } from './references';
import { needsTokenApproval } from './actions/unlock';
import { getQuoteAllowanceTargetAddress } from './validation';

export const createUnlockAndCrosschainSwapRap = async (swapParameters: RapSwapActionParameters<'crosschainSwap'>) => {
  let actions: RapAction<'crosschainSwap' | 'unlock'>[] = [];
  const { sellAmount, assetToBuy, quote, chainId, assetToSell } = swapParameters;

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
      amount: sellAmount,
      assetToUnlock: assetToSell,
      chainId,
      contractAddress: allowanceTargetAddress,
    } satisfies RapUnlockActionParameters);
    actions = actions.concat(unlock);
  }

  // create a swap rap
  const swap = createNewAction('crosschainSwap', {
    chainId,
    requiresApprove,
    nonce: swapParameters.nonce,
    quote,
    meta: swapParameters.meta,
    assetToSell,
    sellAmount,
    assetToBuy,
    gasParams: swapParameters.gasParams,
    gasFeeParamsBySpeed: swapParameters.gasFeeParamsBySpeed,
  } satisfies RapSwapActionParameters<'crosschainSwap'>);
  actions = actions.concat(swap);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
