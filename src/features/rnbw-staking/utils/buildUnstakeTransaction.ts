import { type Address } from 'viem';

import { TransactionDirection, TransactionStatus, type NewTransaction } from '@/entities/transactions';
import { RainbowError } from '@/logger';
import { toTransactionAsset } from '@/raps/transactionAsset';
import { backendNetworksActions } from '@/state/backendNetworks/backendNetworks';

import { STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS } from '../constants';
import { buildSyntheticRnbwSourceAsset } from './syntheticRnbwSourceAsset';

export function buildUnstakeTransaction({
  address,
  unstakeAmountRaw,
}: {
  address: Address;
  unstakeAmountRaw: string;
}): Omit<NewTransaction, 'hash'> {
  const chainName = backendNetworksActions.getChainsName()[STAKING_CHAIN_ID];
  const asset = buildSyntheticRnbwSourceAsset();
  if (!asset) {
    throw new RainbowError('[buildUnstakeTransaction]: RNBW source asset unavailable');
  }

  const transactionAsset = toTransactionAsset({ asset, chainName });

  return {
    asset: transactionAsset,
    chainId: STAKING_CHAIN_ID,
    changes: [
      {
        address_from: STAKING_CONTRACT_ADDRESS,
        address_to: address,
        asset: transactionAsset,
        direction: TransactionDirection.IN,
        price: asset.price?.value,
        value: unstakeAmountRaw,
      },
    ],
    from: address,
    network: chainName,
    nonce: -1,
    status: TransactionStatus.pending,
    to: STAKING_CONTRACT_ADDRESS,
    type: 'unstake',
    value: '0',
  };
}
