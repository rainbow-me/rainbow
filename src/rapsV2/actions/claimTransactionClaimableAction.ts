import { ActionProps } from '../references';
import { sendTransaction } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';
import { RainbowError } from '@/logger';
import { addNewTransaction } from '@/state/pendingTransactions';
import { NewTransaction } from '@/entities';
import { chainsName } from '@/chains';

export async function claimTransactionClaimable({ parameters, wallet }: ActionProps<'claimTransactionClaimableAction'>) {
  const { claimTx, asset } = parameters;

  const provider = getProvider({ chainId: claimTx.chainId });
  const result = await sendTransaction({ transaction: claimTx, existingWallet: wallet, provider });

  if (!result?.result || !!result.error || !result.result.hash) {
    throw new RainbowError('[CLAIM-TRANSACTION-CLAIMABLE]: failed to execute claim transaction');
  }

  const transaction = {
    amount: '0x0',
    gasLimit: result.result.gasLimit,
    from: result.result.from ?? null,
    to: result.result.to ?? null,
    chainId: result.result.chainId,
    hash: result.result.hash,
    network: chainsName[result.result.chainId],
    status: 'pending',
    type: 'claim',
    nonce: result.result.nonce,
    asset,
  } satisfies NewTransaction;

  addNewTransaction({
    address: claimTx.from,
    chainId: claimTx.chainId,
    transaction,
  });

  return {
    nonce: result.result.nonce,
    hash: result.result.hash,
  };
}
