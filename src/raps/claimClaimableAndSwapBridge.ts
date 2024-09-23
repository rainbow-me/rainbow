import { createNewActionV2, createNewRapV2 } from './common';
import { RapActionV2, RapClaimClaimableAndSwapBridgeParameters } from './references';

export const createClaimClaimableAndSwapBridgeRap = async (parameters: RapClaimClaimableAndSwapBridgeParameters) => {
  let actions: RapActionV2<'claimClaimable'>[] = [];

  const claim = createNewActionV2('claimClaimable', parameters.claimClaimableActionParameters);
  actions = actions.concat(claim);

  // create the overall rap
  const newRap = createNewRapV2(actions);
  return newRap;
};
