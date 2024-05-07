import { TransactionResponse } from '@ethersproject/providers';

import { ZerionAsset } from '@/entities/tokens';
import { LegacyTransactionGasParams, TransactionGasParams } from '@/entities/gas';
import { Network } from '@/networks/types';
import { AddysAsset, ParsedAsset } from '../assets/types';

type ChainId = number;

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

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

type BaseTransaction = {
  hash: TxHash;
  nonce: number; // -2 when not from the wallet user
  from: string;
  to?: string; // it may not have a to if it's a contract deployment (covalent)
  data?: string;
  network: Network;

  changes?: Array<
    | {
        asset: ParsedAsset;
        direction: TransactionDirection;
        address_from?: string;
        address_to?: string;
        value?: number | string;
        price?: number | string;
      }
    | undefined
  >;
  direction?: TransactionDirection;
  flashbots?: boolean;

  value?: string; // network asset amount sent with the tx (like eth or matic)
  fee?: string;
  native?: {
    // fee and value but in the user prefered currency terms (USD, EUR, etc)
    value?: string;
    fee?: string;
  };

  type: TransactionType;
  protocol?: string;
  title: string;
  description?: string;

  asset?: AddysAsset; // this is the relevant tx asset, like the asset being sold/approved/withdrawn etc
  approvalAmount?: 'UNLIMITED' | (string & object);
  contract?: {
    name: string;
    iconUrl?: string;
  };

  feeType?: 'legacy' | 'eip-1559';
  gasPrice?: string;
  gasLimit?: string;
  baseFee?: string;
} & Partial<TransactionGasParams & LegacyTransactionGasParams>;

export type PendingTransaction = BaseTransaction & {
  status: 'pending';
};

type MinedTransaction = BaseTransaction & {
  status: 'confirmed' | 'failed';
  flashbotsStatus?: 'CANCELLED' | 'FAILED' | 'INCLUDED';
  blockNumber: number;
  minedAt: number;
  confirmations: number;
  gasUsed: string;
};

type NewTransaction = Omit<PendingTransaction, 'title' | 'changes'> & {
  changes?: Array<
    | {
        direction: TransactionDirection;
        asset: AddysAsset; // becomes a user asset when the transaction is parsed
        value?: number | string;
        price?: number | string;
      }
    | undefined
  >;
};

const transactionTypes = {
  withoutChanges: ['cancel', 'contract_interaction', 'deployment', 'approve', 'revoke', 'speed_up'],
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
  ],
} as const;

export type TransactionWithChangesType = (typeof transactionTypes.withChanges)[number];
export type TransactionWithoutChangesType = (typeof transactionTypes.withoutChanges)[number];

export type TransactionType = TransactionWithChangesType | TransactionWithoutChangesType;

export type TransactionDirection = 'in' | 'out' | 'self';

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
