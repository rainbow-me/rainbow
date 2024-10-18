import { Address } from 'viem';
import { createNewAction, createNewRap } from './common';
import { RapAction, RapSwapActionParameters } from './references';
import { RainbowError } from '@/logger';
import { CrosschainQuote } from '@rainbow-me/swaps';
import { assetNeedsUnlocking } from './actions';

export async function createClaimClaimableRap(parameters: RapSwapActionParameters<'claimClaimable'>) {
  let actions: RapAction<'claimClaimable' | 'crosschainSwap' | 'unlock' | 'swap'>[] = [];

  const { sellAmount, assetToBuy, quote, chainId, toChainId, assetToSell, meta, gasFeeParamsBySpeed, gasParams, additionalParams } =
    parameters;

  if (!additionalParams?.claimTx) throw new RainbowError('[raps/claimClaimable]: claimTx is undefined');

  const claim = createNewAction('claimClaimable', {
    claimTx: additionalParams.claimTx,
    asset: assetToSell,
  });
  actions = actions.concat(claim);

  const {
    from: accountAddress,
    allowanceTarget,
    allowanceNeeded,
  } = quote as {
    from: Address;
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
    });
    actions = actions.concat(crosschainSwap);
  }

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
}
