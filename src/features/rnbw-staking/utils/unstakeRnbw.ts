import { encodeFunctionData, type Address, type Hash } from 'viem';
import { getProvider } from '@/handlers/web3';
import { loadWallet } from '@/model/wallet';
import { STAKING_ABI, STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS } from '../constants';
import { useStakingPositionStore } from '../stores/rnbwStakingPositionStore';
import { pollForStakingUpdate } from './pollForStakingUpdate';

export async function unstakeRnbw({ address }: { address: Address }): Promise<Hash> {
  const provider = getProvider({ chainId: STAKING_CHAIN_ID });
  const signer = await loadWallet({ address, provider });
  if (!signer) {
    throw new Error('Failed to load wallet');
  }

  const originalStakedRnbwShares = useStakingPositionStore.getState().getData()?.poolShares ?? '0';
  const data = encodeFunctionData({ abi: STAKING_ABI, functionName: 'unstakeAll' });

  const tx = await signer.sendTransaction({
    to: STAKING_CONTRACT_ADDRESS,
    data,
  });

  await tx.wait();
  await pollForStakingUpdate(originalStakedRnbwShares);

  return tx.hash as Hash;
}
