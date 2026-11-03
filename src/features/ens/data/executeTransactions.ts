import type { Signer } from '@ethersproject/abstract-signer';
import { getAddress } from 'viem';

import { analytics } from '@/analytics';
import { TransactionStatus, type NewTransaction } from '@/entities/transactions';
import { parseGasParamAmounts } from '@/features/gas/utils/parseGas';
import { ChainId, Network } from '@/features/network/types/backendNetworks';
import { estimateGasWithPadding, getProvider, toHex } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import store from '@/redux/store';
import { addNewTransaction } from '@/state/pendingTransactions/addNewTransaction';

import type { EnsAction } from '../types/transactions';
import { prepareEnsTransactions } from './transactions';

/**
 * Executes the prepared ENS calls in order. A dependent call is sent only after
 * its predecessor confirms; any failure stops the sequence and reaches the caller.
 */
export async function executeEnsTransactions(wallet: Signer, action: EnsAction, nonce: number, onSubmitted?: () => void): Promise<number> {
  const account = getAddress(await wallet.getAddress());
  const provider = getProvider({ chainId: ChainId.mainnet });
  const transactions = await prepareEnsTransactions(action, account);
  const gasParams = parseGasParamAmounts(store.getState().gas.selectedGasFee);
  let nextNonce = nonce;
  analytics.track(analytics.event.ensRapStarted, { category: 'raps', label: action.type });

  try {
    for (let index = 0; index < transactions.length; index++) {
      const prepared = transactions[index];
      const gasLimit = await estimateGasWithPadding({ from: account, to: prepared.to, data: prepared.data }, null, null, provider);
      if (!gasLimit) throw new Error('Unable to estimate ENS transaction');
      const tx = await wallet.sendTransaction({
        to: prepared.to,
        data: prepared.data,
        gasLimit,
        ...gasParams,
        nonce: nextNonce,
      });
      nextNonce = tx.nonce + 1;

      if (prepared.operation === 'records') {
        analytics.track(analytics.event.ensEditedRecords, { category: 'profiles' });
      } else if (prepared.operation === 'reclaim') {
        analytics.track(analytics.event.ensTransferredControl, { category: 'profiles' });
      }

      const transaction = {
        chainId: ChainId.mainnet,
        data: tx.data,
        ensRegistration: true,
        from: account,
        hash: tx.hash,
        ...gasParams,
        nonce: tx.nonce,
        type: 'contract_interaction',
        contract: { name: 'ENS', iconUrl: 'https://rainbowme-res.cloudinary.com/image/upload/v1668565116/dapps/ens.domains.png' },
        to: tx.to ?? null,
        value: toHex(tx.value),
        network: Network.mainnet,
        status: TransactionStatus.pending,
      } satisfies NewTransaction;
      addNewTransaction({ address: account, transaction, chainId: ChainId.mainnet });
      await tx.wait();
    }
    onSubmitted?.();
    analytics.track(analytics.event.ensRapCompleted, { category: 'raps', label: action.type });
    return nextNonce;
  } catch (error) {
    analytics.track(analytics.event.ensRapFailed, { category: 'raps', failed_action: action.type, label: action.type });
    logger.error(new RainbowError('[ENS] Transaction sequence failed', error));
    throw error;
  }
}
