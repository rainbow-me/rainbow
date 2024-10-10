import { Address } from 'viem';
import { createNewAction, createNewRap } from './common';
import { RapAction, RapParameters } from './references';

export async function createClaimTransactionClaimableRap(parameters: Extract<RapParameters, { type: 'claimTransactionClaimableRap' }>) {
  let actions: RapAction<'claimTransactionClaimableAction' | 'crosschainSwapAction' | 'unlockAction'>[] = [];

  const claim = createNewAction('claimTransactionClaimableAction', {
    ...parameters.claimTransactionClaimableActionParameters,
    gasFeeParamsBySpeed: parameters.gasFeeParamsBySpeed,
    gasParams: parameters.gasParams,
  });
  actions = actions.concat(claim);

  const { sellAmount, assetToBuy, quote, chainId, assetToSell, meta, gasFeeParamsBySpeed, gasParams } =
    parameters.crosschainSwapActionParameters.swapData;

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
    const unlock = createNewAction('unlockAction', {
      fromAddress: accountAddress,
      amount: sellAmount,
      assetToUnlock: assetToSell,
      chainId,
      contractAddress: quote.to,
      gasFeeParamsBySpeed: parameters.gasFeeParamsBySpeed,
      gasParams: parameters.gasParams,
    });
    actions = actions.concat(unlock);
  }

  // create a crosschain swap rap
  const swap = createNewAction('crosschainSwapAction', {
    chainId,
    requiresApprove: swapAssetNeedsUnlocking,
    quote,
    meta: meta,
    assetToSell,
    sellAmount,
    assetToBuy,
    gasParams: gasParams,
    gasFeeParamsBySpeed: gasFeeParamsBySpeed,
  });
  actions = actions.concat(swap);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
}
