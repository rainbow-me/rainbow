import { type StaticJsonRpcProvider } from '@ethersproject/providers';
import { decodeFunctionResult, erc20Abi, encodeFunctionData, type Address, type Hex } from 'viem';
import { STAKING_CONTRACT_ADDRESS, RNBW_TOKEN_ADDRESS } from '../constants';
import { lessThanWorklet } from '@/framework/core/safeMath';

export async function checkIfStakingNeedsApproval({
  address,
  provider,
  stakeAmountRaw,
}: {
  address: Address;
  provider: StaticJsonRpcProvider;
  stakeAmountRaw: string;
}): Promise<boolean> {
  const data = encodeFunctionData({ abi: erc20Abi, functionName: 'allowance', args: [address, STAKING_CONTRACT_ADDRESS] });
  const result = await provider.call({ to: RNBW_TOKEN_ADDRESS, data });
  const currentAllowance = decodeFunctionResult({ abi: erc20Abi, functionName: 'allowance', data: result as Hex });
  return lessThanWorklet(currentAllowance.toString(), stakeAmountRaw);
}
