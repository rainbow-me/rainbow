import { createNewAction, createNewRap } from './common';
import { RapAction, RapParameters } from './references';

export async function createClaimTransactionClaimableRap(parameters: Extract<RapParameters, { type: 'claimTransactionClaimableRap' }>) {
  let actions: RapAction<'claimTransactionClaimableAction'>[] = [];

  const claim = createNewAction('claimTransactionClaimableAction', parameters.claimTransactionClaimableActionParameters);
  actions = actions.concat(claim);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
}
