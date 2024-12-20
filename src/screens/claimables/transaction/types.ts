import { ChainId } from '@/state/backendNetworks/types';
import { TransactionRequest } from '@ethersproject/providers';

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
  decimals: number;
}
