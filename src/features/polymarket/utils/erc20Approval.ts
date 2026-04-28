import { type BigNumberish } from '@ethersproject/bignumber';
import { OperationType, type SafeTransaction } from '@polymarket/builder-relayer-client';
import { maxUint256, type Address } from 'viem';

import { encodeErc20Approve } from '@/framework/core/evm/erc20Calldata';
import { hasSufficientErc20Allowance, type EvmCallProvider } from '@/framework/data/evm/erc20Read';

const DEFAULT_ERC20_APPROVAL_AMOUNT = maxUint256;

export function buildErc20ApprovalTransaction({
  amount = DEFAULT_ERC20_APPROVAL_AMOUNT,
  spender,
  tokenAddress,
}: {
  amount?: BigNumberish;
  spender: Address;
  tokenAddress: Address;
}): SafeTransaction {
  return {
    to: tokenAddress,
    data: encodeErc20Approve({ amount, spender }),
    value: '0',
    operation: OperationType.Call,
  };
}

export async function getMissingErc20ApprovalTransaction({
  amount = DEFAULT_ERC20_APPROVAL_AMOUNT,
  owner,
  provider,
  spender,
  tokenAddress,
}: {
  amount?: BigNumberish;
  owner: Address;
  provider: EvmCallProvider;
  spender: Address;
  tokenAddress: Address;
}): Promise<SafeTransaction[]> {
  if (await hasSufficientErc20Allowance({ amount, owner, provider, spender, tokenAddress })) {
    return [];
  }

  return [buildErc20ApprovalTransaction({ spender, tokenAddress })];
}
