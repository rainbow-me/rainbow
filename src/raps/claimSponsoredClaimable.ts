import { createNewActionV2, createNewRapV2 } from './common';
import { RapActionV2, RapParameters } from './references';

export const createClaimSponsoredClaimableRap = async (parameters: Extract<RapParameters, { type: 'claimSponsoredClaimableRap' }>) => {
  let actions: RapActionV2<'claimSponsoredClaimableAction'>[] = [];

  const claim = createNewActionV2('claimSponsoredClaimableAction', parameters.claimSponsoredClaimableActionParameters);
  actions = actions.concat(claim);

  // create the overall rap
  const newRap = createNewRapV2(actions);
  return newRap;
};
