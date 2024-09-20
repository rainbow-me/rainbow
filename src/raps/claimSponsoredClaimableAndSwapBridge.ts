import { createNewAction, createNewRap } from './common';
import { RapAction, RapClaimSponsoredClaimableAndSwapBridgeParameters } from './references';

export const createSponsoredClaimClaimableAndSwapBridgeRap = async (parameters: RapClaimSponsoredClaimableAndSwapBridgeParameters) => {
  let actions: RapAction<'claimSponsoredClaimable'>[] = [];

  const claim = createNewAction('claimSponsoredClaimable', parameters.claimSponsoredClaimableActionParameters);
  actions = actions.concat(claim);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
