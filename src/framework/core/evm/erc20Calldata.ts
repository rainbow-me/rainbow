import { BigNumber, type BigNumberish } from '@ethersproject/bignumber';
import { encodeFunctionData, erc20Abi, type Address, type Hex } from 'viem';

export function toBigInt(amount: BigNumberish): bigint {
  return BigInt(BigNumber.from(amount).toString());
}

export function encodeErc20Approve({ amount, spender }: { amount: BigNumberish; spender: string | Address }): Hex {
  return encodeFunctionData({
    abi: erc20Abi,
    functionName: 'approve',
    args: [spender as Address, toBigInt(amount)],
  });
}

export function encodeErc20Transfer({ amount, to }: { amount: BigNumberish; to: string | Address }): Hex {
  return encodeFunctionData({
    abi: erc20Abi,
    functionName: 'transfer',
    args: [to as Address, toBigInt(amount)],
  });
}
