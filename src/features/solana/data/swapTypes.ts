import { type SolanaSwapAsset, type SWAP_ASSETS, type SwapReview } from '@/features/solana/core/swap';
import { type EnabledSolanaAccount } from '@/features/wallet/data/stores/accountMetadataStore';
import { type PreparedRouteExecution } from '@rainbow-me/solana-sdk';

export type PreparedSwap = Omit<SwapReview, 'inputAsset' | 'prepared'> & {
  route: 'swap';
  networkFeeLamports: bigint;
  account: EnabledSolanaAccount;
} & (
    | { sourceChain: 'evm'; inputAsset: (typeof SWAP_ASSETS)['base-eth']; prepared: PreparedRouteExecution<'evm'> }
    | { sourceChain: 'solana'; inputAsset: SolanaSwapAsset; prepared: PreparedRouteExecution<'solana'> }
  );
