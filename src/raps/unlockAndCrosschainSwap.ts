import { resolveApprovalRequirement } from './approval';
import { createNewAction } from './common';
import type { RapSwapActionParameters, SwapRap } from './references';

export const createUnlockAndCrosschainSwapRap = async (
  swapParameters: RapSwapActionParameters<'crosschainSwap'>
): Promise<SwapRap<'crosschainSwap'>> => {
  const { sellAmount, assetToBuy, quote, chainId, assetToSell } = swapParameters;

  const { allowanceTargetAddress, requiresApprove } = await resolveApprovalRequirement({
    quote,
    chainId,
    sellAmount,
  });

  const unlock =
    requiresApprove && allowanceTargetAddress
      ? createNewAction('unlock', {
          fromAddress: quote.from,
          amount: sellAmount,
          assetToUnlock: assetToSell,
          chainId,
          contractAddress: allowanceTargetAddress,
        })
      : null;

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
  });

  return { actions: unlock ? [unlock, swap] : [swap], type: 'crosschainSwap' };
};
