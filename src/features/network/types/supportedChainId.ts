import { type SOLANA_CHAIN_ID } from '@/features/solana/core/chainId';

import { type ChainId } from './backendNetworks';

export type SupportedChainId = ChainId | typeof SOLANA_CHAIN_ID;
