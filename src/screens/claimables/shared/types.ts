export type ClaimStatus =
  | 'notReady' // preparing the data necessary to claim
  | 'ready' // ready to claim state
  | 'claiming' // user has pressed the claim button
  | 'pending' // claim has been submitted but we don't have a tx hash
  | 'success' // claim has been submitted and we have a tx hash
  | 'recoverableError' // claim or auth has failed, can try again
  | 'unrecoverableError'; // swap has failed, unrecoverable error
