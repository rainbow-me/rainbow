import { parseUnits, type Address, type Hash } from 'viem';
import { stakeRnbwManual } from './stakeRnbwManual';
import { stakeRnbwSponsored } from './stakeRnbwSponsored';
import { getProvider } from '@/handlers/web3';
import { DelegationStatus, getDelegations } from '@rainbow-me/delegation';
import { RNBW_DECIMALS, STAKING_CHAIN_ID } from '../constants';
import { useStakingPositionStore } from '../stores/rnbwStakingPositionStore';
import { pollForStakingUpdate } from './pollForStakingUpdate';

export async function stakeRnbw({ address, amount }: { address: Address; amount: string }): Promise<Hash> {
  const provider = getProvider({ chainId: STAKING_CHAIN_ID });
  const stakeAmountRaw = parseUnits(amount, RNBW_DECIMALS).toString();
  const delegations = await getDelegations({ address });
  const chainDelegation = delegations.find(delegation => delegation.chainId === STAKING_CHAIN_ID);
  const isRainbowDelegated = chainDelegation?.delegationStatus === DelegationStatus.RAINBOW_DELEGATED;

  const originalStakedRnbwShares = useStakingPositionStore.getState().getData()?.poolShares ?? '0';

  const transactionHash: Hash = isRainbowDelegated
    ? await stakeRnbwSponsored({ address, provider, stakeAmountRaw })
    : await stakeRnbwManual({ address, provider, stakeAmountRaw });

  await pollForStakingUpdate(originalStakedRnbwShares);

  return transactionHash;
}
