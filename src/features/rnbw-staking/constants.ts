import { type Address } from 'viem';
import { ChainId } from '@/state/backendNetworks/types';
import { getUniqueId } from '@/utils/ethereumUtils';

// TODO: test token address, use prod address later '0xa53887f7e7c1bf5010b8627f1c1ba94fe7a5d6e0'
export const RNBW_TOKEN_ADDRESS: Address = '0xb61832AD7859e64d8525E51d13De94d693475e6b';
export const RNBW_CHAIN_ID = ChainId.base;
export const RNBW_TOKEN_UNIQUE_ID = getUniqueId(RNBW_TOKEN_ADDRESS, RNBW_CHAIN_ID).toLowerCase();
export const RNBW_DECIMALS = 18;
