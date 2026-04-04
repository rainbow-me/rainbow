import { parseAbi, type Address } from 'viem';
import { ChainId } from '@/state/backendNetworks/types';
import { getUniqueId } from '@/utils/ethereumUtils';

export const RNBW_TOKEN_ADDRESS: Address = '0xa53887f7e7c1bf5010b8627f1c1ba94fe7a5d6e0';
export const RNBW_CHAIN_ID = ChainId.base;
export const RNBW_UNIQUE_ID = getUniqueId(RNBW_TOKEN_ADDRESS, RNBW_CHAIN_ID).toLowerCase();
export const RNBW_DECIMALS = 18;
export const RNBW_TOKEN_UNIQUE_ID = getUniqueId(RNBW_TOKEN_ADDRESS, RNBW_CHAIN_ID).toLowerCase();
export const RNBW_TOKEN_ICON_URL =
  'https://rainbowme-res.cloudinary.com/image/upload/v1770040117/assets/base/0xa53887f7e7c1bf5010b8627f1c1ba94fe7a5d6e0.png';

export const STAKING_CHAIN_ID = ChainId.base;
export const STAKING_CONTRACT_ADDRESS: Address = '0x288ea8Bcb51d53aD361D786EFa904C401904aF70';
export const STAKING_ABI = parseAbi([
  'function stake(uint256 amount)',
  'function unstakeAll()',
  'function minStakeAmount() view returns (uint256)',
  'function exitFeeBps() view returns (uint256)',
]);
export const STAKING_GAS_LIMIT = 200_000;
export const DEFAULT_EXIT_FEE_PERCENTAGE = 10;

export const MIN_CLAIM_TO_STAKING_RAW = '1000000000000000000'; // 1 RNBW (10^18)
