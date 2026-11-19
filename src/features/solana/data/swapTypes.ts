import { type SolanaSwapAssetId, type SwapReview } from '@/features/solana/core/swap';
import { type EnabledSolanaAccount } from '@/features/wallet/data/stores/accountMetadataStore';
import { type PreparedRouteExecution } from '@rainbow-me/solana-sdk';

export type PreparedSwap = Omit<SwapReview, 'inputAsset' | 'prepared'> & {
  route: 'swap';
  networkFeeLamports: bigint;
  account: EnabledSolanaAccount;
} & (
    | { inputAsset: 'base-eth'; prepared: PreparedRouteExecution<'evm'> }
    | { inputAsset: SolanaSwapAssetId; prepared: PreparedRouteExecution<'solana'> }
  );
