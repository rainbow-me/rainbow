import { createQueryStore } from '@storesjs/stores';
import { decodeFunctionResult, encodeFunctionData, type Hex } from 'viem';

import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';

import { STAKING_ABI, STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS } from '../constants';

export const useStakingExitFeeStore = createQueryStore<number>({ fetcher: readExitFeePercentage }, { storageKey: 'rnbwStakingExitFee' });

async function readExitFeePercentage(): Promise<number> {
  try {
    const provider = getProvider({ chainId: STAKING_CHAIN_ID });
    const data = encodeFunctionData({ abi: STAKING_ABI, functionName: 'exitFeeBps' });
    const result = await provider.call({ to: STAKING_CONTRACT_ADDRESS, data });
    const exitFeeBps = decodeFunctionResult({ abi: STAKING_ABI, functionName: 'exitFeeBps', data: result as Hex });
    return Number(exitFeeBps) / 100;
  } catch (e) {
    logger.error(new RainbowError('[readExitFeePercentage]: Failed to read exit fee percentage', e));
    throw e;
  }
}
