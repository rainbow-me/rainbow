import { metadataPOSTClient } from '@/graphql';
import { ActionProps } from '../references';

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
export async function claim({ parameters, wallet, baseNonce }: ActionProps<'claim'>) {
  const { address } = parameters;
  if (!address) {
    throw new Error('[CLAIM]: missing address');
  }
  // when DO_FAKE_CLAIM is true, we use mock data (can do as many as we want)
  // otherwise we do a real claim (can be done once, then backend needs to reset it)
  const claimInfo = DO_FAKE_CLAIM ? CLAIM_MOCK_DATA : await metadataPOSTClient.claimUserRewards({ address });

  // Checking ig we got the tx hash
  const txHash = claimInfo.claimUserRewards?.txHash;
  if (!txHash) {
    // If there's no transaction hash the relayer didn't submit the transaction
    // so we can't contnue
    throw new Error('[CLAIM]: missing tx hash from backend');
  }

  // We need to make sure the transaction is mined
  // so we get the transaction
  const claimTx = await wallet?.provider?.getTransaction(txHash);
  if (!claimTx) {
    // If we can't get the transaction we can't continue
    throw new Error('[CLAIM]: tx not found');
  }

  // then we wait for the receipt of the transaction
  // to conirm it was mined
  const receipt = await claimTx?.wait();
  if (!receipt) {
    // If we can't get the receipt we can't continue
    throw new Error('[CLAIM]: tx not mined');
  }

  // finally we check if the transaction was successful
  const success = receipt?.status === 1;
  if (!success) {
    // The transaction failed, we can't continue
    throw new Error('[CLAIM]: claim tx failed onchain');
  }

  // If the transaction was successful we can return the hash

  return {
    nonce: (baseNonce || 0) - 1,
    hash: txHash,
  };
}
