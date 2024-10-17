import { Address } from 'viem';
import { createNewAction, createNewRap } from './common';
import { RapAction, RapSwapActionParameters } from './references';
import { RainbowError } from '@/logger';
import { CrosschainQuote } from '@rainbow-me/swaps';
import { assetNeedsUnlocking } from './actions';

export async function createClaimClaimableRap(parameters: RapSwapActionParameters<'claimClaimable'>) {
  let actions: RapAction<'claimClaimable' | 'crosschainSwap' | 'unlock' | 'swap'>[] = [];

  // const gas = {
  //   gas: {
  //     gasFeeParamsBySpeed: parameters.crosschainSwapActionParameters.gasFeeParamsBySpeed,
  //     gasParams: parameters.crosschainSwapActionParameters.gasParams,
  //   },
  // };

  const claim = createNewAction('claimClaimable', {
    claimTx: parameters.additionalParams.claimTx,
    asset: parameters.assetToSell,
  });
  actions = actions.concat(claim);

  const { sellAmount, assetToBuy, quote, chainId, toChainId, assetToSell, meta, gasFeeParamsBySpeed, gasParams } = parameters;

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
    if (!quote.to) throw new RainbowError('[raps/claimClaimable]: quote.to is undefined');

    const unlock = createNewAction('unlock', {
      fromAddress: accountAddress,
      assetToUnlock: assetToSell,
      chainId,
      contractAddress: quote.to as Address,
    });
    actions = actions.concat(unlock);
  }

  if (chainId === toChainId) {
    console.log('SWAP ACTION');
    // create a swap rap
    const swap = createNewAction('swap', {
      chainId: chainId,
      requiresApprove: swapAssetNeedsUnlocking,
      quote: quote as CrosschainQuote,
      meta: meta,
      assetToSell,
      sellAmount,
      assetToBuy,
      gasParams,
      gasFeeParamsBySpeed,
      additionalParams: undefined,
    });
    actions = actions.concat(swap);
  } else {
    // create a crosschain swap rap
    const crosschainSwap = createNewAction('crosschainSwap', {
      chainId: chainId,
      requiresApprove: swapAssetNeedsUnlocking,
      quote: quote as CrosschainQuote,
      meta: meta,
      assetToSell,
      sellAmount,
      assetToBuy,
      gasParams,
      gasFeeParamsBySpeed,
      additionalParams: undefined,
    });
    actions = actions.concat(crosschainSwap);
  }

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
}
