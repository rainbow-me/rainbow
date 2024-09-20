import { metadataPOSTClient } from '@/graphql';
import { ActionProps, ActionPropsV2 } from '../references';
import { loadWallet, sendTransaction } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { addNewTransaction } from '@/state/pendingTransactions';
import { NewTransaction } from '@/entities';
import { chainsName } from '@/chains';

const CLAIM_MOCK_DATA = {
  claimUserRewards: {
    error: null,
    chainID: 10,
    uoHash: '0x0edba9b7e5abb9a48db607fa66f6ff60aa1b342ef728c028782e6215b986e01e',
    txHash: '0x73b0f5615698f0e2f34628267940a4fabcb17c44ff9da4b99b6c493dfca52e57',
  },
};

const DO_FAKE_CLAIM = false;

// This action is used to claim the rewards of the user
// by making an api call to the backend which would use a relayer
// to do the claim and send the funds to the user
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
