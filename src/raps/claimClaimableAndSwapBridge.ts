import { createNewAction, createNewRap } from './common';
import { RapAction, RapClaimClaimableAndSwapBridgeParameters } from './references';

export const createClaimClaimableAndSwapBridgeRap = async (parameters: RapClaimClaimableAndSwapBridgeParameters) => {
  let actions: RapAction<'claimClaimable'>[] = [];

  const claim = createNewAction('claimClaimable', parameters.claimClaimableActionParameters);
  actions = actions.concat(claim);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
