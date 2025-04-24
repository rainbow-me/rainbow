import { ActionProps, RapActionResult } from '../references';
import { executeClaim } from '@/screens/claimables/transaction/claim';

export async function claimClaimable({ wallet, parameters }: ActionProps<'claimClaimable'>): Promise<RapActionResult> {
  const { claimTx, asset } = parameters;

  const [results] = await executeClaim({ asset, claimTxns: [claimTx], wallet });
  return results;
}
