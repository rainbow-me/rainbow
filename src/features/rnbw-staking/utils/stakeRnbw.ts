import { parseUnits, type Address, type Hash } from 'viem';
import { stakeRnbwManual } from './stakeRnbwManual';
import { stakeRnbwSponsored } from './stakeRnbwSponsored';
import { getProvider } from '@/handlers/web3';
import { RNBW_DECIMALS, STAKING_CHAIN_ID } from '../constants';
import { useStakingPositionStore } from '../stores/rnbwStakingPositionStore';
import { pollForStakingUpdate } from './pollForStakingUpdate';
import { loadWallet } from '@/model/wallet';
import { isRainbowDelegatedForChain } from '@/features/delegation/utils/isRainbowDelegatedForChain';
import { Alert } from 'react-native';

export async function stakeRnbw({ address, amount }: { address: Address; amount: string }): Promise<Hash> {
  const provider = getProvider({ chainId: STAKING_CHAIN_ID });
  const signer = await loadWallet({ address, provider });
  if (!signer) {
    throw new Error('Failed to load wallet');
  }
  const stakeAmountRaw = parseUnits(amount, RNBW_DECIMALS).toString();
  const isRainbowDelegated = await isRainbowDelegatedForChain(address, STAKING_CHAIN_ID);

  const originalStakedRnbwShares = useStakingPositionStore.getState().getData()?.poolShares ?? '0';

  const transactionHash: Hash = isRainbowDelegated
    ? await stakeRnbwSponsored({ signer, address, provider, stakeAmountRaw })
    : await stakeRnbwManual({ signer, address, provider, stakeAmountRaw });

  await pollForStakingUpdate(originalStakedRnbwShares);

  // TODO: For testing. Remove
  Alert.alert(`Staked: ${amount} RNBW (${isRainbowDelegated ? 'Sponsored' : 'Manual'})`, transactionHash);
  return transactionHash;
}
