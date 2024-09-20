import { ActionPropsV2 } from '../references';
import { sendTransaction } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';
import { RainbowError } from '@/logger';
import { addNewTransaction } from '@/state/pendingTransactions';
import { NewTransaction } from '@/entities';
import { chainsName } from '@/chains';

export async function claimClaimable({ parameters, wallet, baseNonce }: ActionPropsV2<'claimClaimable'>) {
  const { claimTx } = parameters;

  const provider = getProvider({ chainId: claimTx.chainId });
  const result = await sendTransaction({ transaction: claimTx, existingWallet: wallet, provider });

  if (!result?.result || !!result.error || !result.result.hash) {
    throw new RainbowError('[CLAIM-CLAIMABLE]: failed to execute claim transaction');
  }

  const transaction = {
    amount: result.result.value.toString(),
    gasLimit: result.result.gasLimit,
    from: result.result.from ?? null,
    to: result.result.to ?? null,
    chainId: result.result.chainId,
    hash: result.result.hash,
    network: chainsName[result.result.chainId],
    status: 'pending',
    type: 'send',
    nonce: result.result.nonce,
  } satisfies NewTransaction;

  addNewTransaction({
    address: claimTx.from,
    chainId: claimTx.chainId,
    transaction,
  });

  return {
    nonce: result?.result?.nonce,
    hash: result?.result?.hash,
  };
}
