import { BigNumberish } from '@ethersproject/bignumber';
import { ProtocolType } from '../protocolTypes';
import { ParsedAddressAsset, ZerionAsset } from '../tokens';
import { EthereumAddress } from '../wallet';
import { AddCashCurrencyAsset } from '@/references';
import { SwapType } from '@rainbow-me/swaps';
import { SwapMetadata } from '@/raps/references';
import { UniqueAsset } from '../uniqueAssets';
import { ParsedAsset, AddysAsset } from '@/resources/assets/types';
import { ChainId, Network } from '@/state/backendNetworks/types';
import { TransactionResponse } from '@ethersproject/providers';

import { BytesLike } from '@ethersproject/bytes';

export enum TransactionDirection {
  IN = 'in',
  OUT = 'out',
  SELF = 'self',
}

export enum TransactionStatus {
  approved = 'approved',
  approving = 'approving',
  bridging = 'bridging',
  bridged = 'bridged',
  cancelled = 'cancelled',
  cancelling = 'cancelling',
  confirmed = 'confirmed',
  contract_interaction = 'contract interaction',
  deposited = 'deposited',
  depositing = 'depositing',
  dropped = 'dropped',
  failed = 'failed',
  minted = 'minted',
  minting = 'minting',
  pending = 'pending',
  purchased = 'purchased',
  purchasing = 'purchasing',
  received = 'received',
  receiving = 'receiving',
  self = 'self',
  selling = 'selling',
  sold = 'sold',
  sending = 'sending',
  sent = 'sent',
  speeding_up = 'speeding up',
  swapped = 'swapped',
  swapping = 'swapping',
  unknown = 'unknown status',
  withdrawing = 'withdrawing',
  withdrew = 'withdrew',
}

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
  chainId: ChainId;
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
  data?: string | BytesLike; // for pending tx
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
  network: string;
  nft?: UniqueAsset;
  nonce?: number | null;
  protocol?: ProtocolType | null;
  approvalAmount?: 'UNLIMITED' | (string & Record<string, never>);
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
  status: TransactionStatus.confirmed | TransactionStatus.failed;
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

export type TransactionChanges = (
  | {
      asset: ParsedAsset;
      value: number | undefined;
      direction: TransactionDirection;
      address_from: string;
      address_to: string;
      price: number;
    }
  | undefined
)[];
/**
 * Metadata for a message from the Zerion API.
 */
export interface MessageMeta {
  address?: string;
  currency?: string;
  cut_off?: number;
  status?: string;
  chain_id?: Network; // L2
  chain_ids?: ChainId[]; // v3 consolidated
  chain_ids_with_errors?: ChainId[]; // v3 consolidated
  asset_codes?: string;
  next_page_cursor?: string;
}

/**
 * A message from the Zerion API indicating that assets were received.
 */
export interface AddressAssetsReceivedMessage {
  payload?: {
    assets?: {
      asset: ZerionAsset;
      quantity: string;
      small_balances?: boolean;
    }[];
  };
  meta?: MessageMeta;
}

/**
 * A message from the Zerion API indicating that transaction data was received.
 */
export interface TransactionsReceivedMessage {
  payload?: {
    transactions?: PaginatedTransactionsApiResponse[];
  };
  meta?: MessageMeta;
}

/**
 * A message from the Zerion API indicating that asset price data was received
 */
export interface AssetPricesReceivedMessage {
  payload?: {
    prices?: {
      [id: string]: ZerionAsset;
    };
  };
  meta?: MessageMeta;
}

export type TxHash = `0x${string}`;

export type PendingTransaction = RainbowTransaction & {
  status: TransactionStatus.pending;
};

export const TransactionType = {
  withoutChanges: ['cancel', 'contract_interaction', 'deployment', 'approve', 'revoke', 'speed_up'] as readonly string[],
  withChanges: [
    'sale',
    'bridge',
    'airdrop',
    'wrap',
    'unwrap',
    'bid',
    'burn',
    'send',
    'receive',
    'withdraw',
    'deposit',
    'mint',
    'swap',
    'borrow',
    'claim',
    'repay',
    'stake',
    'unstake',
    'purchase',
  ] as readonly string[],
} as const;

export type TransactionWithChangesType = (typeof TransactionType.withChanges)[number];
export type TransactionWithoutChangesType = (typeof TransactionType.withoutChanges)[number];

export type TransactionType = TransactionWithChangesType | TransactionWithoutChangesType;

export interface ExecuteRapResponse extends TransactionResponse {
  errorMessage?: string;
}

export type TransactionApiResponse = {
  status: TransactionStatus;
  id: TxHash;
  hash: TxHash;
  network: Network;
  protocol?: string;
  direction?: TransactionDirection;
  address_from?: string;
  address_to?: string;
  // nonce will ALWAYS be -2 when the transaction is *not* from the wallet user
  nonce: number;
  changes: Array<
    | {
        asset: AddysAsset;
        value: number | null;
        direction: TransactionDirection;
        address_from: string;
        address_to: string;
        price: number;
      }
    | undefined
  >;
  fee: {
    value: number;
    price: number;

    // Fee Details are only available on the tx by hash endpoint
    // (won't be available on the consolidated txs list)
    details?: {
      type: 0 | 2;
      type_label: 'legacy' | 'eip-1559';
      gas_price: number;
      gas_limit: number;
      gas_used: number;
      max_fee: number;
      max_priority_fee: number;
      base_fee: number;
      max_base_fee: number;
      rollup_fee_details: {
        l1_fee: number;
        l1_fee_scalar: number;
        l1_gas_price: number;
        l1_gas_used: number;
        l2_fee: number;
      };
    };
  };
  block_confirmations?: number; // also only available on the tx by hash endpoint
  meta: {
    contract_name?: string;
    contract_icon_url?: string;
    type?: TransactionType;
    action?: string;
    asset?: AddysAsset;
    quantity?: 'UNLIMITED' | string;
    explorer_label?: string;
    explorer_url?: string;
  };
  block_number?: number;
  mined_at?: number;
};

export type PaginatedTransactionsApiResponse = Omit<TransactionApiResponse, 'fee'> & {
  fee: Omit<TransactionApiResponse['fee'], 'details'>;
};
