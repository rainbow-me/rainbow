import { ActionProps, RapActionResult } from '../references';
import { sendTransaction } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';
import { RainbowError } from '@/logger';
import { addNewTransaction } from '@/state/pendingTransactions';
import { LegacyTransactionGasParamAmounts, NewTransaction, TransactionGasParamAmounts, TransactionStatus } from '@/entities';
import { chainsName } from '@/chains';
import { overrideWithFastSpeedIfNeeded } from '../utils';
import { AddysNetworkDetails, ParsedAsset } from '@/resources/assets/types';
import { TokenColors } from '@/graphql/__generated__/metadata';

export async function claimClaimable({
  wallet,
  currentRap,
  index,
  parameters,
  baseNonce,
  gasParams,
  gasFeeParamsBySpeed,
}: ActionProps<'claimClaimable'>): Promise<RapActionResult> {
  const { claimTx, asset } = parameters;

  const provider = getProvider({ chainId: claimTx.chainId });

  let expeditedTx = claimTx;

  // if (currentRap.actions.length - 1 > index) {
  //   gasParamsToUse = overrideWithFastSpeedIfNeeded({
  //     gasParams,
  //     chainId,
  //     gasFeeParamsBySpeed,
  //   });
  // }

  // if (shouldExpedite && gas) {
  //   const expeditedGas = overrideWithFastSpeedIfNeeded({
  //     gasParams: gas.gasParams,
  //     chainId: claimTx.chainId,
  //     gasFeeParamsBySpeed: gas.gasFeeParamsBySpeed,
  //   });

  //   expeditedTx = { ...expeditedTx, ...expeditedGas };
  // }

  const result = await sendTransaction({ transaction: expeditedTx, existingWallet: wallet, provider });

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
