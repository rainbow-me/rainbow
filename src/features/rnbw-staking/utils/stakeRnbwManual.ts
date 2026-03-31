import { type StaticJsonRpcProvider } from '@ethersproject/providers';
import { type Signer } from '@ethersproject/abstract-signer';
import { erc20Abi, encodeFunctionData, type Address, type Hash } from 'viem';
import { STAKING_CONTRACT_ADDRESS, STAKING_ABI, RNBW_TOKEN_ADDRESS, STAKING_GAS_LIMIT } from '../constants';
import { checkIfStakingNeedsApproval } from './checkIfStakingNeedsApproval';

export async function stakeRnbwManual({
  address,
  signer,
  provider,
  stakeAmountRaw,
}: {
  address: Address;
  signer: Signer;
  provider: StaticJsonRpcProvider;
  stakeAmountRaw: string;
}): Promise<Hash> {
  const needsApproval = await checkIfStakingNeedsApproval({ address, provider, stakeAmountRaw });
  const stakeAmountBigInt = BigInt(stakeAmountRaw);
  if (needsApproval) {
    const approveTx = await signer.sendTransaction({
      to: RNBW_TOKEN_ADDRESS,
      data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [STAKING_CONTRACT_ADDRESS, stakeAmountBigInt] }),
    });
    await approveTx.wait();
  }

  const data = encodeFunctionData({ abi: STAKING_ABI, functionName: 'stake', args: [stakeAmountBigInt] });
  const tx = await signer.sendTransaction({
    to: STAKING_CONTRACT_ADDRESS,
    data,
    gasLimit: STAKING_GAS_LIMIT,
  });
  await tx.wait();

  return tx.hash as Hash;
}
