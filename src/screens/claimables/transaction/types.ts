import { ChainId } from '@/chains/types';
import { TransactionRequest } from '@ethersproject/providers';

export type ClaimStatus =
  | 'fetchingQuote' // fetching quote
  | 'ready' // ready to claim state
  | 'claiming' // user has pressed the claim button
  | 'pending' // claim has been submitted but we don't have a tx hash
  | 'success' // claim has been submitted and we have a tx hash
  | 'error' // claim has failed
  | 'noRoute' // no swap route available
  | 'noQuote'; // no quote available

// supports legacy and new gas types
export type TransactionClaimableTxPayload = TransactionRequest &
  (
    | {
        to: string;
        from: string;
        nonce: number;
        gasLimit: string;
        maxFeePerGas: string;
        maxPriorityFeePerGas: string;
        data: string;
        value: '0x0';
        chainId: number;
      }
    | {
        to: string;
        from: string;
        nonce: number;
        gasLimit: string;
        gasPrice: string;
        data: string;
        value: '0x0';
        chainId: number;
      }
  );

export interface TokenToReceive {
  networks: Partial<Record<ChainId, { address: string }>>;
  symbol: string;
  iconUrl?: string;
  name: string;
  isNativeAsset: boolean;
  mainnetAddress: string;
  isDefaultAsset: boolean;
}
