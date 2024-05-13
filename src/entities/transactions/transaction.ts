import { BigNumberish } from '@ethersproject/bignumber';
import { ProtocolType } from '../protocolTypes';
import { ParsedAddressAsset } from '../tokens';
import { EthereumAddress } from '../wallet';
import { Network } from '@/helpers/networkTypes';
import { AddCashCurrencyAsset } from '@/references';
import { ChainId, SwapType } from '@rainbow-me/swaps';
import { SwapMetadata } from '@/raps/references';
import { UniqueAsset } from '../uniqueAssets';
import { ParsedAsset } from '@/resources/assets/types';
import { TransactionStatus, TransactionType } from '@/resources/transactions/types';

export type TransactionDirection = 'in' | 'out' | 'self';

export interface RainbowTransaction {
  address?: string;
  asset?:
    | (ParsedAsset & {
        asset_contract?: {
          address?: string;
        };
      })
    | null;
  balance?: {
    amount: string;
    display: string;
  } | null;
  changes?: Array<
    | {
        asset: ParsedAddressAsset;
        direction: TransactionDirection;
        address_from?: string;
        address_to?: string;
        value?: number | string;
        price?: number | string;
      }
    | undefined
  >;
  contract?: {
    name: string;
    iconUrl?: string;
  };
  direction?: TransactionDirection;
  description?: string;
  data?: string; // for pending tx
  from: EthereumAddress | null;
  gasLimit?: BigNumberish;
  gasPrice?: BigNumberish;
  maxFeePerGas?: BigNumberish;
  maxPriorityFeePerGas?: BigNumberish;
  hash: string;
  minedAt?: number | null;
  name?: string | null;
  native?: {
    amount: string;
    display: string;
  };
  network: Network;
  nft?: UniqueAsset;
  nonce?: number | null;
  protocol?: ProtocolType | null;
  flashbots?: boolean;
  approvalAmount?: 'UNLIMITED' | (string & object);
  ensCommitRegistrationName?: string;
  ensRegistration?: boolean;
  sourceAmount?: string; // for purchases
  status: TransactionStatus;
  swap?: {
    type: SwapType;
    toChainId: ChainId;
    fromChainId: ChainId;
    isBridge: boolean;
  };
  symbol?: string | null;
  timestamp?: number; // for purchases
  title: string;
  to: EthereumAddress | null;
  transferId?: string; // for purchases
  txTo?: EthereumAddress | null;
  type: TransactionType;
  value?: BigNumberish; // for pending tx
  fee?: RainbowTransactionFee;
  explorerLabel?: string;
  explorerUrl?: string;
}

export type MinedTransaction = RainbowTransaction & {
  status: 'confirmed' | 'failed';
  flashbotsStatus?: 'CANCELLED' | 'FAILED' | 'INCLUDED';
  blockNumber: number;
  minedAt: number;
  confirmations: number;
  gasUsed: string;
};

export type NewTransaction = Omit<RainbowTransaction, 'title' | 'changes'> & {
  amount?: string;
  gasLimit?: BigNumberish;
  changes?: Array<
    | {
        asset: ParsedAddressAsset;
        direction: TransactionDirection;
        address_from?: string;
        address_to?: string;
        value?: number | string;
        price?: number | string;
      }
    | undefined
  >;

  swap?: {
    type: SwapType;
    fromChainId: ChainId;
    toChainId: ChainId;
    isBridge: boolean;
  };
  meta?: SwapMetadata;
  nonce: number;
};

export interface RainbowTransactionFee {
  value: {
    amount: string;
    display: string;
  };
  native?: {
    amount: string;
    display: string;
  };
}

export interface NewTransactionOrAddCashTransaction extends Omit<NewTransaction, 'asset'> {
  // Although the type of `asset` really represents
  // `ParsedAddressAsset | AddCashCurrencyAsset | null`, it is more
  // convenient for typing purposes to use
  // `Partial<ParsedAddressAsset> & AddCashCurrencyAsset` with the implication
  // that all of the `ParsedAddressAsset` fields would be undefined.
  // Statements such as `transaction?.asset?.price?.value` would fail to
  // compile without the partial since `AddCashCurrencyAsset` does not have the
  // key `price`, even though the statement is safe.
  asset: ParsedAddressAsset | (Partial<ParsedAddressAsset> & AddCashCurrencyAsset) | null;
}

export type MinimalTransactionDetails = Pick<RainbowTransaction, 'minedAt' | 'hash' | 'type' | 'network' | 'from' | 'to' | 'status'>;
