import { executeClaim } from '@/screens/claimables/transaction/claim';

import { type ActionProps, type RapActionResult } from '../references';

export async function claimClaimable({ wallet, parameters }: ActionProps<'claimClaimable'>): Promise<RapActionResult> {
  const { claimTx, asset } = parameters;

  const [results] = await executeClaim({ asset, claimTxns: [claimTx], wallet });
  return results;
}
