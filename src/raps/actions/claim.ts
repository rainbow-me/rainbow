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

// This action is used to claim the rewards of the user
// by making an api call to the backend which would use a relayer
// to do the claim and send the funds to the user
export async function claim({ parameters, wallet, baseNonce }: ActionProps<'claim'>) {
  const { address } = parameters;
  if (!address) {
    throw new Error('Invalid address');
  }

  console.log('claim action called with params', parameters);
  // when IS_TESTING is true, we use mock data (can do as many as we want)
  // otherwise we do a real claim (can be done once, then backend needs to reset it)
  const claimInfo = process.env.IS_TESTING === 'true' ? CLAIM_MOCK_DATA : await metadataPOSTClient.claimUserRewards({ address });

  // Just for testing purposes so we know what the state of the ENV VARS are
  console.log('ENV VARS', {
    IS_TESTING: process.env.IS_TESTING,
    INTERNAL_BUILD: process.env.INTERNAL_BUILD,
  });

  console.log('got claim tx hash', claimInfo);
  // Checking ig we got the tx hash
  const txHash = claimInfo.claimUserRewards?.txHash;
  if (!txHash) {
    // If there's no transaction hash the relayer didn't submit the transaction
    // so we can't contnue
    console.log('did not get tx hash', claimInfo);
    throw new Error('Failed to claim rewards');
  }

  console.log('getting claim tx');
  // We need to make sure the transaction is mined
  // so we get the transaction
  const claimTx = await wallet?.provider?.getTransaction(txHash);
  console.log('got claim tx', claimTx);
  console.log('waiting for claim tx to be mined');

  // then we wait for the receipt of the transaction
  // to conirm it was mined
  const receipt = await claimTx?.wait();
  console.log('got claim tx receipt', receipt);

  // finally we check if the transaction was successful
  const success = receipt?.status === 1;
  if (!success) {
    // The transaction failed, we can't continue
    console.log('claim tx failed', receipt);
    throw new Error('Failed to claim rewards');
  }

  // If the transaction was successful we can return the hash
  console.log('Claimed succesful');

  return {
    nonce: (baseNonce || 0) - 1,
    hash: txHash,
  };
}
