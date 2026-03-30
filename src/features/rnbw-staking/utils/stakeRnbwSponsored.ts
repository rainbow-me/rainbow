import { type StaticJsonRpcProvider } from '@ethersproject/providers';
import { type BatchCall } from '@rainbow-me/delegation';
import { createGelatoEvmRelayerClient } from '@gelatocloud/gasless/_dist/relayer/evm/index.js';
import { erc20Abi, encodeFunctionData, type Address, type Hash, type Hex } from 'viem';
import { GELATO_API_KEY } from 'react-native-dotenv';
import { getProvider, toHex } from '@/handlers/web3';
import { RainbowError } from '@/logger';
import { time } from '@/utils/time';
import { STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS, STAKING_ABI, RNBW_TOKEN_ADDRESS } from '../constants';
import { prepareSignedBatchedCalldata } from '../../delegation/utils/signBatchedCall';
import { checkIfStakingNeedsApproval } from './checkIfStakingNeedsApproval';
import type { Signer } from '@ethersproject/abstract-signer';

export async function stakeRnbwSponsored({
  signer,
  address,
  provider,
  stakeAmountRaw,
}: {
  signer: Signer;
  address: Address;
  provider: StaticJsonRpcProvider;
  stakeAmountRaw: string;
}): Promise<Hash> {
  const calls = await buildStakeCalls({ address, provider, stakeAmountRaw });

  const signedTx = await prepareSignedBatchedCalldata({
    signer,
    address,
    chainId: STAKING_CHAIN_ID,
    calls: calls.map(c => ({ to: c.to, value: BigInt(c.value), data: c.data })),
  });

  return relayTransaction({ from: address, chainId: STAKING_CHAIN_ID, to: signedTx.to, data: signedTx.data });
}

async function relayTransaction({ from, chainId, to, data }: { from: Address; chainId: number; to: Address; data: Hex }): Promise<Hash> {
  const provider = getProvider({ chainId });

  const gasEstimate = await provider.estimateGas({ from, to, data });

  const gelatoRelayer = createGelatoEvmRelayerClient({
    apiKey: GELATO_API_KEY,
    pollingInterval: time.ms(500),
    timeout: time.seconds(30),
  });

  const taskId = await gelatoRelayer.sendTransaction({ chainId, to, data, skipSimulation: true, gas: gasEstimate.toBigInt() });
  const receipt = await gelatoRelayer.waitForReceipt({ id: taskId }, { usePolling: true });

  if (!receipt.transactionHash) {
    throw new RainbowError('[stakeRnbwSponsored]: gelato relay failed - no transaction hash');
  }

  if (receipt.status !== 'success') {
    throw new RainbowError('[stakeRnbwSponsored]: gelato relay failed - transaction failed');
  }

  return receipt.transactionHash;
}

async function buildStakeCalls({
  address,
  provider,
  stakeAmountRaw,
}: {
  address: Address;
  provider: StaticJsonRpcProvider;
  stakeAmountRaw: string;
}): Promise<BatchCall[]> {
  const calls: BatchCall[] = [];

  const needsApproval = await checkIfStakingNeedsApproval({ address, provider, stakeAmountRaw });
  if (needsApproval) {
    calls.push({
      to: RNBW_TOKEN_ADDRESS,
      value: toHex(0),
      data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [STAKING_CONTRACT_ADDRESS, BigInt(stakeAmountRaw)] }),
    });
  }

  calls.push({
    to: STAKING_CONTRACT_ADDRESS,
    value: toHex(0),
    data: encodeFunctionData({ abi: STAKING_ABI, functionName: 'stake', args: [BigInt(stakeAmountRaw)] }),
  });

  return calls;
}
