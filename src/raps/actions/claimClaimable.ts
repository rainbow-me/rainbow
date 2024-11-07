import { ActionProps, RapActionResult } from '../references';
import { executeClaim } from '@/screens/claimables/transaction/utils';

export async function claimClaimable({ wallet, parameters }: ActionProps<'claimClaimable'>): Promise<RapActionResult> {
  const { claimTx, asset } = parameters;

  return executeClaim({ asset, claimTx, wallet });
}
