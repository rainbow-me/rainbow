import { createNewAction, createNewRap } from './common';
import { RapAction, RapClaimActionParameters } from './references';

export const createClaimAndBridgeRap = async (claimParameters: RapClaimActionParameters) => {
  let actions: RapAction<'claim' | 'claimBridge'>[] = [];
  const { assetToSell, sellAmount, assetToBuy, meta, chainId, toChainId, address, gasParams } = claimParameters;

  const claim = createNewAction('claim', claimParameters);
  actions = actions.concat(claim);

  // if we need the bridge
  if (chainId !== toChainId && toChainId !== undefined) {
    // create a bridge rap
    const bridge = createNewAction('claimBridge', {
      address,
      chainId,
      toChainId,
      meta,
      assetToSell,
      sellAmount,
      assetToBuy,
      quote: undefined,
      gasParams,
    } satisfies RapClaimActionParameters);

    actions = actions.concat(bridge);
  }

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
