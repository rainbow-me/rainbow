import { Address } from 'viem';

import { assetNeedsUnlocking } from './actions';
import { createNewAction, createNewRap } from './common';
import { RapAction, RapSwapActionParameters, RapUnlockActionParameters } from './references';

export const createUnlockAndCrosschainSwapRap = async (swapParameters: RapSwapActionParameters<'crosschainSwap'>) => {
  let actions: RapAction<'crosschainSwap' | 'unlock'>[] = [];
  const { sellAmount, assetToBuy, quote, chainId, assetToSell } = swapParameters;

  const {
    from: accountAddress,
    sellTokenAddress,
    buyTokenAddress,
    allowanceTarget,
    allowanceNeeded,
  } = quote as {
    from: Address;
    sellTokenAddress: Address;
    buyTokenAddress: Address;
    allowanceTarget: Address;
    allowanceNeeded: boolean;
  };

  let swapAssetNeedsUnlocking = false;

  if (allowanceNeeded) {
    swapAssetNeedsUnlocking = await assetNeedsUnlocking({
      owner: accountAddress,
      amount: sellAmount,
      assetToUnlock: assetToSell,
      spender: allowanceTarget,
      chainId,
    });
  }

  if (swapAssetNeedsUnlocking) {
    const unlock = createNewAction('unlock', {
      fromAddress: accountAddress,
      amount: sellAmount,
      assetToUnlock: assetToSell,
      chainId,
      contractAddress: quote.to,
    } as RapUnlockActionParameters);
    actions = actions.concat(unlock);
  }

  // create a swap rap
  const swap = createNewAction('crosschainSwap', {
    chainId,
    requiresApprove: swapAssetNeedsUnlocking,
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
