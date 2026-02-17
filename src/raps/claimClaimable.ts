import { Address } from 'viem';
import { createNewAction, createNewRap } from './common';
import { RapAction, RapSwapActionParameters } from './references';
import { logger, RainbowError } from '@/logger';
import { CrosschainQuote } from '@rainbow-me/swaps';
import { needsTokenApproval } from './actions/unlock';

export async function createClaimClaimableRap(parameters: RapSwapActionParameters<'claimClaimable'>) {
  let actions: RapAction<'claimClaimable' | 'crosschainSwap' | 'unlock' | 'swap'>[] = [];

  const { sellAmount, assetToBuy, quote, chainId, toChainId, assetToSell, meta, gasFeeParamsBySpeed, gasParams, additionalParams } =
    parameters;

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

  const {
    from: accountAddress,
    sellTokenAddress,
    allowanceTarget,
    allowanceNeeded,
  } = quote as {
    from: Address;
    sellTokenAddress: Address;
    allowanceTarget: Address;
    allowanceNeeded: boolean;
  };
  const requiresApprove =
    allowanceNeeded &&
    (await needsTokenApproval({
      owner: accountAddress,
      tokenAddress: sellTokenAddress,
      spender: allowanceTarget,
      amount: sellAmount,
      chainId,
    }));

  if (requiresApprove) {
    const unlock = createNewAction('unlock', {
      fromAddress: accountAddress,
      assetToUnlock: assetToSell,
      chainId,
      contractAddress: allowanceTarget,
      amount: sellAmount,
    });
    actions = actions.concat(unlock);
  }

  if (chainId === toChainId) {
    // create a swap rap
    const swap = createNewAction('swap', {
      chainId: chainId,
      requiresApprove,
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
      requiresApprove,
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
