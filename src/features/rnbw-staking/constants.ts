import { type Address, parseAbi } from 'viem';
import { ChainId } from '@/state/backendNetworks/types';
import { IS_DEV } from '@/env';

// TODO: Flip to `false` when switching to the production token
const USE_TEST_STAKING_TOKEN = true && IS_DEV;

export const STAKING_CHAIN_ID = ChainId.base;
export const STAKING_CONTRACT_ADDRESS: Address = '0x616EB863bd79145c20B44A9A070A3651662D1EBD';
export const RNBW_TOKEN_ADDRESS: Address = USE_TEST_STAKING_TOKEN
  ? '0xb61832AD7859e64d8525E51d13De94d693475e6b'
  : '0xa53887f7e7c1bf5010b8627f1c1ba94fe7a5d6e0';
export const RNBW_CHAIN_ID = ChainId.base;
export const RNBW_DECIMALS = 18;
export const STAKING_ABI = parseAbi([
  'function stake(uint256 amount)',
  'function unstakeAll()',
  'function minStakeAmount() view returns (uint256)',
]);
export const STAKING_GAS_LIMIT = 200_000;
