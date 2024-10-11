import { Address } from 'viem';
import { createNewAction, createNewRap } from './common';
import { RapAction, RapParameters } from './references';
import { RainbowError } from '@/logger';
import { assetNeedsUnlocking } from './actions/unlockAction';

export async function createClaimTransactionClaimableRap(parameters: Extract<RapParameters, { type: 'claimTransactionClaimableRap' }>) {
  let actions: RapAction<'claimTransactionClaimableAction' | 'crosschainSwapAction' | 'unlockAction'>[] = [];

  const gas = {
    gas: {
      gasFeeParamsBySpeed: parameters.crosschainSwapActionParameters.gasFeeParamsBySpeed,
      gasParams: parameters.crosschainSwapActionParameters.gasParams,
    },
  };

  const claim = createNewAction(
    'claimTransactionClaimableAction',
    {
      ...parameters.claimTransactionClaimableActionParameters,
      ...gas,
    },
    true
  );
  actions = actions.concat(claim);

  const { sellAmount, assetToBuy, quote, chainId, assetToSell, meta, gasFeeParamsBySpeed, gasParams } =
    parameters.crosschainSwapActionParameters;

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
    if (!quote.to) throw new RainbowError('[rapsV2/claimTransactionClaimableRap]: quote.to is undefined');

    const unlock = createNewAction(
      'unlockAction',
      {
        fromAddress: accountAddress,
        assetToUnlock: assetToSell,
        chainId,
        contractAddress: quote.to as Address,
        ...gas,
      },
      true
    );
    actions = actions.concat(unlock);
  }

  // create a crosschain swap rap
  const swap = createNewAction('crosschainSwapAction', {
    chainId: chainId,
    requiresApprove: swapAssetNeedsUnlocking,
    quote,
    meta: meta,
    assetToSell,
    sellAmount,
    assetToBuy,
    ...gas.gas,
  });
  actions = actions.concat(swap);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
}
