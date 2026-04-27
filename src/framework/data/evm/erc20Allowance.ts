import { type BigNumberish } from '@ethersproject/bignumber';
import { decodeFunctionResult, encodeFunctionData, erc20Abi, type Address, type Hex } from 'viem';

import { toBigInt } from '@/framework/core/evm/erc20Calldata';

export type EvmCallProvider = {
  call: (transaction: { to: string; data: Hex }) => Promise<string>;
};

type Erc20AllowanceParams = {
  owner: string;
  provider: EvmCallProvider;
  spender: string;
  tokenAddress: string;
};

export async function getErc20Allowance({ owner, provider, spender, tokenAddress }: Erc20AllowanceParams): Promise<bigint> {
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'allowance',
    args: [owner as Address, spender as Address],
  });
  const result = await provider.call({ to: tokenAddress, data });

  return decodeFunctionResult({
    abi: erc20Abi,
    functionName: 'allowance',
    data: result as Hex,
  });
}

export async function hasSufficientErc20Allowance({
  amount,
  owner,
  provider,
  spender,
  tokenAddress,
}: Erc20AllowanceParams & {
  amount: BigNumberish;
}): Promise<boolean> {
  const allowance = await getErc20Allowance({ owner, provider, spender, tokenAddress });

  return allowance >= toBigInt(amount);
}
