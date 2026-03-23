import { encodeFunctionData, type Address, type Hash } from 'viem';
import { getProvider } from '@/handlers/web3';
import { loadWallet } from '@/model/wallet';
import { STAKING_CONTRACT_ADDRESS, STAKING_ABI, STAKING_CHAIN_ID } from '../constants';
import { useStakingPositionStore } from '../stores/rnbwStakingPositionStore';
import { pollForStakingUpdate } from './pollForStakingUpdate';

export async function unstakeRnbw({ address }: { address: Address }): Promise<Hash> {
  const provider = getProvider({ chainId: STAKING_CHAIN_ID });
  const wallet = await loadWallet({ address, provider });
  if (!wallet) {
    throw new Error('Failed to load wallet');
  }

  const originalStakedRnbw = useStakingPositionStore.getState().getData()?.stakedRnbw ?? '0';

  const data = encodeFunctionData({ abi: STAKING_ABI, functionName: 'unstakeAll' });
  const gasEstimate = await provider.estimateGas({ to: STAKING_CONTRACT_ADDRESS, data, from: address });
  const tx = await wallet.sendTransaction({
    to: STAKING_CONTRACT_ADDRESS,
    data,
    gasLimit: gasEstimate,
  });
  await tx.wait();

  await pollForStakingUpdate(originalStakedRnbw);

  return tx.hash as Hash;
}
