import { ActionProps } from '../references';
import { sendTransaction } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';
import { RainbowError } from '@/logger';
import { addNewTransaction } from '@/state/pendingTransactions';
import { LegacyTransactionGasParamAmounts, NewTransaction, TransactionGasParamAmounts, TransactionStatus } from '@/entities';
import { chainsName } from '@/chains';
import { overrideWithFastSpeedIfNeeded } from '../utils';

export async function claimTransactionClaimable({ parameters, wallet, shouldExpedite }: ActionProps<'claimTransactionClaimableAction'>) {
  const { claimTx, asset, gas } = parameters;

  const provider = getProvider({ chainId: claimTx.chainId });

  let expeditedTx = claimTx;

  if (shouldExpedite && gas) {
    const expeditedGas = overrideWithFastSpeedIfNeeded({
      gasParams: gas.gasParams,
      chainId: claimTx.chainId,
      gasFeeParamsBySpeed: gas.gasFeeParamsBySpeed,
    });

    expeditedTx = { ...expeditedTx, ...expeditedGas };
  }

  const result = await sendTransaction({ transaction: expeditedTx, existingWallet: wallet, provider });

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
    status: TransactionStatus.pending,
    type: 'claim',
    nonce: result.result.nonce,
    asset,
  } satisfies NewTransaction;

  addNewTransaction({
    address: claimTx.from,
    chainId: claimTx.chainId,
    transaction,
  });

  const tx = await wallet?.provider?.getTransaction(result.result.hash);
  const receipt = await tx?.wait();
  if (!receipt) {
    throw new RainbowError('[CLAIM-TRANSACTION-CLAIMABLE]: tx not mined');
  }

  return {
    nonce: result.result.nonce,
    hash: result.result.hash,
  };
}
