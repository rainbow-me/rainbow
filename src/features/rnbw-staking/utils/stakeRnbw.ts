import { parseUnits, type Address, type Hash } from 'viem';
import { stakeRnbwManual } from './stakeRnbwManual';
import { getProvider } from '@/handlers/web3';
import { RNBW_DECIMALS, STAKING_CHAIN_ID } from '../constants';
import { useStakingPositionStore } from '../stores/rnbwStakingPositionStore';
import { pollForStakingUpdate } from './pollForStakingUpdate';
import { loadWallet } from '@/model/wallet';

export async function stakeRnbw({ address, amount }: { address: Address; amount: string }): Promise<Hash> {
  const provider = getProvider({ chainId: STAKING_CHAIN_ID });
  const signer = await loadWallet({ address, provider });
  if (!signer) {
    throw new Error('Failed to load wallet');
  }

  const originalStakedRnbwShares = useStakingPositionStore.getState().getData()?.poolShares ?? '0';
  const stakeAmountRaw = parseUnits(amount, RNBW_DECIMALS).toString();
  const transactionHash: Hash = await stakeRnbwManual({ signer, address, provider, stakeAmountRaw });
  await pollForStakingUpdate(originalStakedRnbwShares);

  return transactionHash;
}
