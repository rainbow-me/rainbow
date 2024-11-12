import { chainsName } from '@/chains';
import { NewTransaction, TransactionStatus } from '@/entities';
import { TokenColors } from '@/graphql/__generated__/metadata';
import { getProvider } from '@/handlers/web3';
import { RainbowError } from '@/logger';
import { sendTransaction } from '@/model/wallet';
import { addNewTransaction } from '@/state/pendingTransactions';
import { TransactionClaimableTxPayload } from './types';
import { Signer } from '@ethersproject/abstract-signer';
import { ParsedAsset as SwapsParsedAsset } from '@/__swaps__/types/assets';
import { AddysNetworkDetails, ParsedAsset } from '@/resources/assets/types';

export async function executeClaim({
  asset,
  claimTx,
  wallet,
}: {
  asset: SwapsParsedAsset | ParsedAsset;
  claimTx: TransactionClaimableTxPayload;
  wallet: Signer;
}) {
  const provider = getProvider({ chainId: claimTx.chainId });

  const result = await sendTransaction({ transaction: claimTx, existingWallet: wallet, provider });

  if (!result?.result || !!result.error || !result.result.hash) {
    throw new RainbowError('[CLAIM-CLAIMABLE]: failed to execute claim transaction');
  }

  const parsedAsset = {
    ...asset,
    network: chainsName[result.result.chainId],
    networks: asset.networks as Record<string, AddysNetworkDetails>,
    colors: asset.colors as TokenColors,
  } satisfies ParsedAsset;

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
    asset: parsedAsset,
  } satisfies NewTransaction;

  addNewTransaction({
    address: claimTx.from,
    chainId: claimTx.chainId,
    transaction,
  });

  const tx = await wallet?.provider?.getTransaction(result.result.hash);
  const receipt = await tx?.wait();
  if (!receipt) {
    throw new RainbowError('[CLAIM-CLAIMABLE]: tx not mined');
  }

  return {
    nonce: result.result.nonce,
    hash: result.result.hash,
  };
}
