import { type StaticJsonRpcProvider } from '@ethersproject/providers';
import { decodeFunctionResult, encodeFunctionData, erc20Abi, isHex, type Address } from 'viem';

import { lessThanWorklet } from '@/framework/core/safeMath';
import { RainbowError } from '@/logger';

import { RNBW_TOKEN_ADDRESS, STAKING_CONTRACT_ADDRESS } from '../constants';

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
  if (!isHex(result)) {
    throw new RainbowError('[checkIfStakingNeedsApproval]: Invalid allowance response');
  }

  const currentAllowance = decodeFunctionResult({ abi: erc20Abi, functionName: 'allowance', data: result });
  return lessThanWorklet(currentAllowance.toString(), stakeAmountRaw);
}
