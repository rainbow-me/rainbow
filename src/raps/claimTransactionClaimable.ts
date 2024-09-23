import { createNewActionV2, createNewRapV2 } from './common';
import { RapActionV2, RapParameters } from './references';

export async function createClaimTransactionClaimableRap(parameters: Extract<RapParameters, { type: 'claimTransactionClaimableRap' }>) {
  let actions: RapActionV2<'claimTransactionClaimableAction'>[] = [];

  const claim = createNewActionV2('claimTransactionClaimableAction', parameters.claimTransactionClaimableActionParameters);
  actions = actions.concat(claim);

  // create the overall rap
  const newRap = createNewRapV2(actions);
  return newRap;
}
