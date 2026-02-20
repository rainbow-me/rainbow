import { getTargetAddress, isAllowedTargetContract } from '@rainbow-me/swaps';
import { createNewAction, createNewRap } from './common';
import { RapAction, RapSwapActionParameters } from './references';
import { needsTokenApproval } from './actions/unlock';

export const createUnlockAndSwapRap = async (swapParameters: RapSwapActionParameters<'swap'>) => {
  let actions: RapAction<'swap' | 'unlock'>[] = [];

  const { sellAmount, quote, chainId, assetToSell, assetToBuy } = swapParameters;
  const { allowanceNeeded, from: accountAddress, sellTokenAddress } = quote;
  const targetAddress = getTargetAddress(quote);
  let requiresApprove = false;

  if (allowanceNeeded) {
    if (!targetAddress) {
      throw new Error('Target address not found');
    }
    const isAllowedTarget = isAllowedTargetContract(targetAddress, chainId);
    if (!isAllowedTarget) {
      throw new Error('Target address not allowed');
    }

    requiresApprove =
      allowanceNeeded &&
      (await needsTokenApproval({
        owner: accountAddress,
        tokenAddress: sellTokenAddress,
        spender: targetAddress,
        amount: sellAmount,
        chainId,
      }));

    if (requiresApprove) {
      const unlock = createNewAction('unlock', {
        fromAddress: accountAddress,
        amount: sellAmount,
        assetToUnlock: assetToSell,
        chainId,
        contractAddress: targetAddress,
      });
      actions = actions.concat(unlock);
    }
  }

  // create a swap rap
  const swap = createNewAction('swap', {
    chainId,
    sellAmount,
    permit: false,
    requiresApprove,
    quote,
    meta: swapParameters.meta,
    assetToSell,
    assetToBuy,
    gasParams: swapParameters.gasParams,
    gasFeeParamsBySpeed: swapParameters.gasFeeParamsBySpeed,
  });
  actions = actions.concat(swap);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
