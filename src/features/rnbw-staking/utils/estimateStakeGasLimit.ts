import { erc20Abi, encodeFunctionData, parseUnits, type Address } from 'viem';
import { getProvider } from '@/handlers/web3';
import { gasUnits } from '@/references/gasUnits';
import { RNBW_DECIMALS, RNBW_TOKEN_ADDRESS, STAKING_ABI, STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS } from '../constants';
import { checkIfStakingNeedsApproval } from './checkIfStakingNeedsApproval';

const FALLBACK_STAKE_GAS_LIMIT = 200_000n;
const FALLBACK_APPROVAL_GAS_LIMIT = BigInt(gasUnits.basic_approval);

export async function estimateStakeGasLimit({ accountAddress, amount }: { accountAddress: Address; amount: string }): Promise<string> {
  const provider = getProvider({ chainId: STAKING_CHAIN_ID });
  const stakeAmount = parseUnits(amount, RNBW_DECIMALS);
  const needsApproval = await checkIfStakingNeedsApproval({
    address: accountAddress,
    provider,
    stakeAmountRaw: stakeAmount.toString(),
  });

  let totalGasLimit = FALLBACK_STAKE_GAS_LIMIT;
  const stakeData = encodeFunctionData({ abi: STAKING_ABI, functionName: 'stake', args: [stakeAmount] });
  try {
    const estimatedStakeGasLimit = await provider.estimateGas({ data: stakeData, from: accountAddress, to: STAKING_CONTRACT_ADDRESS });
    totalGasLimit = estimatedStakeGasLimit.toBigInt();
  } catch {
    totalGasLimit = FALLBACK_STAKE_GAS_LIMIT;
  }

  if (!needsApproval) return totalGasLimit.toString();

  const approveData = encodeFunctionData({
    abi: erc20Abi,
    args: [STAKING_CONTRACT_ADDRESS, stakeAmount],
    functionName: 'approve',
  });

  try {
    const estimatedApproveGasLimit = await provider.estimateGas({
      data: approveData,
      from: accountAddress,
      to: RNBW_TOKEN_ADDRESS,
    });
    return (totalGasLimit + estimatedApproveGasLimit.toBigInt()).toString();
  } catch {
    return (totalGasLimit + FALLBACK_APPROVAL_GAS_LIMIT).toString();
  }
}
