import { getTargetAddress, isAllowedTargetContract } from '@rainbow-me/swaps';
import { Address } from 'viem';
import { createNewAction, createNewRap } from './common';
import { RapAction, RapSwapActionParameters, RapUnlockActionParameters } from './references';
import { needsTokenApproval } from './actions/unlock';

export const createUnlockAndSwapRap = async (swapParameters: RapSwapActionParameters<'swap'>) => {
  let actions: RapAction<'swap' | 'unlock'>[] = [];

  const { sellAmount, quote, chainId, assetToSell, assetToBuy } = swapParameters;
  const {
    allowanceNeeded,
    from: accountAddress,
    sellTokenAddress,
  } = quote as {
    allowanceNeeded: boolean;
    from: Address;
    sellTokenAddress: Address;
  };
  const targetAddress = getTargetAddress(quote);
  let requiresApprove = false;

  if (allowanceNeeded) {
    if (!targetAddress) {
      throw new Error('Target address not found');
    }
    const isAllowedTarget = isAllowedTargetContract(targetAddress, chainId as number);
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
      } satisfies RapUnlockActionParameters);
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
  } satisfies RapSwapActionParameters<'swap'>);
  actions = actions.concat(swap);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
