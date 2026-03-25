import { parseAbi, type Address } from 'viem';
import { ChainId } from '@/state/backendNetworks/types';
import { getUniqueId } from '@/utils/ethereumUtils';

// TODO: test token address, use prod address later '0xa53887f7e7c1bf5010b8627f1c1ba94fe7a5d6e0'
export const RNBW_TOKEN_ADDRESS: Address = '0xb61832AD7859e64d8525E51d13De94d693475e6b';
export const RNBW_CHAIN_ID = ChainId.base;
export const RNBW_DECIMALS = 18;
export const RNBW_TOKEN_UNIQUE_ID = getUniqueId(RNBW_TOKEN_ADDRESS, RNBW_CHAIN_ID).toLowerCase();

export const STAKING_CHAIN_ID = ChainId.base;
export const STAKING_CONTRACT_ADDRESS: Address = '0x616EB863bd79145c20B44A9A070A3651662D1EBD';
export const STAKING_ABI = parseAbi([
  'function stake(uint256 amount)',
  'function unstakeAll()',
  'function minStakeAmount() view returns (uint256)',
]);
export const STAKING_GAS_LIMIT = 200_000;
