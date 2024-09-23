import { createNewActionV2, createNewRapV2 } from './common';
import { RapActionV2, RapClaimSponsoredClaimableAndSwapBridgeParameters } from './references';

export const createSponsoredClaimClaimableAndSwapBridgeRap = async (parameters: RapClaimSponsoredClaimableAndSwapBridgeParameters) => {
  let actions: RapActionV2<'claimSponsoredClaimable'>[] = [];

  const claim = createNewActionV2('claimSponsoredClaimable', parameters.claimSponsoredClaimableActionParameters);
  actions = actions.concat(claim);

  // create the overall rap
  const newRap = createNewRapV2(actions);
  return newRap;
};
