export type ClaimStatus =
  | 'ready' // ready to claim state
  | 'claiming' // user has pressed the claim button
  | 'pending' // claim has been submitted but we don't have a tx hash
  | 'success' // claim has been submitted and we have a tx hash
  | 'error'; // claim has failed
