import { createNewAction, createNewRap } from './common';
import { RapAction, RapClaimRewardsActionParameters } from './references';

export const createClaimClaimableAndSwapBridgeRap = async (claimParameters: RapClaimRewardsActionParameters) => {
  let actions: RapAction<'claimClaimable'>[] = [];
  const { assetToSell, sellAmount, assetToBuy, meta, chainId, toChainId, address, gasParams } = claimParameters;

  const claim = createNewAction('claimClaimable', claimParameters);
  actions = actions.concat(claim);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
