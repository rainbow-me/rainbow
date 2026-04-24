import { type BigNumberish } from '@ethersproject/bignumber';
import { OperationType, type SafeTransaction } from '@polymarket/builder-relayer-client';
import { BigNumber, ethers } from 'ethers';

import { erc20Interface } from '@/features/polymarket/utils/erc20Interface';
import erc20ABI from '@/references/erc20-abi.json';

type Erc20ApprovalTransactionParams = {
  amount?: BigNumberish;
  spender: string;
  tokenAddress: string;
};

type MissingErc20ApprovalTransactionParams = Erc20ApprovalTransactionParams & {
  owner: string;
  provider: ethers.providers.Provider;
};

export function buildErc20ApprovalTransaction({
  amount = ethers.constants.MaxUint256,
  spender,
  tokenAddress,
}: Erc20ApprovalTransactionParams): SafeTransaction {
  return {
    to: tokenAddress,
    data: erc20Interface.encodeFunctionData('approve', [spender, amount]),
    value: '0',
    operation: OperationType.Call,
  };
}

export async function getMissingErc20ApprovalTransaction({
  amount = ethers.constants.MaxUint256,
  owner,
  provider,
  spender,
  tokenAddress,
}: MissingErc20ApprovalTransactionParams): Promise<SafeTransaction[]> {
  const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
  const allowance = (await tokenContract.allowance(owner, spender)) as BigNumber;
  const requiredAmount = BigNumber.from(amount);

  if (allowance.gte(requiredAmount)) {
    return [];
  }

  return [buildErc20ApprovalTransaction({ spender, tokenAddress })];
}
