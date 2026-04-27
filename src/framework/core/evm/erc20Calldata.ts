import { BigNumber, type BigNumberish } from '@ethersproject/bignumber';
import { encodeFunctionData, erc20Abi, type Address, type Hex } from 'viem';

/** Converts ethers-compatible numeric inputs into bigint values for viem calldata builders. */
export function toBigInt(amount: BigNumberish): bigint {
  return BigInt(BigNumber.from(amount).toString());
}

/** Encodes an ERC20 `approve` call for a validated spender address. */
export function encodeErc20Approve({ amount, spender }: { amount: BigNumberish; spender: Address }): Hex {
  return encodeFunctionData({
    abi: erc20Abi,
    functionName: 'approve',
    args: [spender, toBigInt(amount)],
  });
}

/** Encodes an ERC20 `transfer` call for a validated recipient address. */
export function encodeErc20Transfer({ amount, to }: { amount: BigNumberish; to: Address }): Hex {
  return encodeFunctionData({
    abi: erc20Abi,
    functionName: 'transfer',
    args: [to, toBigInt(amount)],
  });
}
