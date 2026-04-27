import { BigNumber, type BigNumberish } from '@ethersproject/bignumber';
import { decodeFunctionResult, encodeFunctionData, erc20Abi, isHex, type Address, type Hex } from 'viem';

import { toBigInt } from '@/framework/core/evm/erc20Calldata';

export type EvmCallProvider = {
  call: (transaction: { to: Address; data: Hex }) => Promise<string>;
};

/**
 * Reads an ERC20 token balance through an ethers-compatible call provider.
 */
export async function getErc20Balance({
  owner,
  provider,
  tokenAddress,
}: {
  owner: Address;
  provider: EvmCallProvider;
  tokenAddress: Address;
}): Promise<BigNumber> {
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [owner],
  });
  const result = await provider.call({ to: tokenAddress, data });
  const balance = decodeFunctionResult({
    abi: erc20Abi,
    functionName: 'balanceOf',
    data: requireHexResult(result),
  });

  return BigNumber.from(balance.toString());
}

/**
 * Reads an ERC20 allowance through an ethers-compatible call provider.
 */
export async function getErc20Allowance({
  owner,
  provider,
  spender,
  tokenAddress,
}: {
  owner: Address;
  provider: EvmCallProvider;
  spender: Address;
  tokenAddress: Address;
}): Promise<bigint> {
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'allowance',
    args: [owner, spender],
  });
  const result = await provider.call({ to: tokenAddress, data });

  return decodeFunctionResult({
    abi: erc20Abi,
    functionName: 'allowance',
    data: requireHexResult(result),
  });
}

/**
 * Checks whether an ERC20 allowance can cover a required amount.
 */
export async function hasSufficientErc20Allowance({
  amount,
  owner,
  provider,
  spender,
  tokenAddress,
}: {
  amount: BigNumberish;
  owner: Address;
  provider: EvmCallProvider;
  spender: Address;
  tokenAddress: Address;
}): Promise<boolean> {
  const allowance = await getErc20Allowance({ owner, provider, spender, tokenAddress });

  return allowance >= toBigInt(amount);
}

function requireHexResult(result: string): Hex {
  if (isHex(result)) return result;
  throw new Error('[erc20Read]: provider returned non-hex call data');
}
