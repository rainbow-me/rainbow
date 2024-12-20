import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { NewTransaction, TransactionStatus } from '@/entities';
import { TokenColors } from '@/graphql/__generated__/metadata';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { sendTransaction } from '@/model/wallet';
import { addNewTransaction } from '@/state/pendingTransactions';
import { TransactionClaimableTxPayload } from './types';
import { Signer } from '@ethersproject/abstract-signer';
import { ParsedAsset as SwapsParsedAsset } from '@/__swaps__/types/assets';
import { AddysNetworkDetails, ParsedAsset } from '@/resources/assets/types';

// also used by raps
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
  const chainsName = useBackendNetworksStore.getState().getChainsName();

  const result = await sendTransaction({ transaction: claimTx, existingWallet: wallet, provider });

  if (!result?.result || !!result.error || !result.result.hash) {
    const error = new RainbowError('[CLAIM-CLAIMABLE]: failed to execute claim transaction');
    logger.error(error);
    throw error;
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
  if (!tx) {
    const error = new RainbowError('[CLAIM-CLAIMABLE]: failed to get transaction');
    logger.error(error);
    throw error;
  }

  const receipt = await tx?.wait();
  if (!receipt) {
    const error = new RainbowError('[CLAIM-CLAIMABLE]: tx not mined');
    logger.error(error);
    throw error;
  }

  return {
    nonce: result.result.nonce,
    hash: result.result.hash,
  };
}
