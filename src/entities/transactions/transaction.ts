import { BigNumberish } from '@ethersproject/bignumber';
import { ProtocolType } from '../protocolTypes';
import { ParsedAddressAsset, ZerionAsset } from '../tokens';
import { EthereumAddress } from '../wallet';
import { AddCashCurrencyAsset } from '@/references';
import { SwapType } from '@rainbow-me/swaps';
import { SwapMetadata } from '@/raps/references';
import { UniqueAsset } from '../uniqueAssets';
import { ParsedAsset } from '@/resources/assets/types';
import { ChainId, Network } from '@/state/backendNetworks/types';
import { TransactionResponse } from '@ethersproject/providers';

import { BytesLike } from '@ethersproject/bytes';

export enum TransactionDirection {
  IN = 'in',
  OUT = 'out',
  SELF = 'self',
}

export enum TransactionStatus {
  confirmed = 'confirmed',
  failed = 'failed',
  pending = 'pending',
}

export interface RainbowTransaction {
  address?: string;
  amount?: string;
  asset?:
    | (ParsedAsset &
        (
          | {
              id?: string;
              contractAddress: never;
            }
          | {
              id?: string;
              contractAddress?: UniqueAsset['contractAddress'];
            }
        ))
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

export const TransactionTypeMap = {
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
    'launch',
  ],
} as const;

export type TransactionWithChangesType = (typeof TransactionTypeMap.withChanges)[number];
export type TransactionWithoutChangesType = (typeof TransactionTypeMap.withoutChanges)[number];

export type TransactionType = TransactionWithChangesType | TransactionWithoutChangesType;

export interface ExecuteRapResponse extends TransactionResponse {
  errorMessage?: string;
}

export type PaginatedTransactionsApiResponse = Omit<TransactionApiResponse, 'fee'> & {
  fee: Omit<TransactionApiResponse['fee'], 'details'>;
};

export interface ListTransactionsRequest {
  /**
   * Wallet address to fetch transactions for
   *
   * examples: "0x742D35Cc6634C0532925a3b8D404020ae0e4f5f3", "0x8ba1f109551bD432803012645Hac136c78baae"
   */
  address: string;
  /**
   * Comma-separated list of blockchain chain IDs to filter transactions by
   *
   * examples: "1,137,56,42161"
   */
  chainIds: string;
  /**
   * Currency to return transaction values in
   *
   * examples: "usd", "eth", "eur"
   */
  currency: string;
  /**
   * Maximum number of transactions to return
   *
   * examples: 10, 50, 100
   */
  limit: number;
  /**
   * If interactions_with_address parameter was passed, we add the filter to the call for given address
   *
   * examples: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
   */
  interactedWithAddress?: string | undefined;
  /** Cursor for pagination, omipt to get the first page */
  cursor?: string | undefined;
}

export interface ListTransactionsResponse {
  /** Metadata about the request */
  metadata?: ResponseMetadata;
  result: TransactionApiResponse[];
  /** Cursor based pagination information */
  pagination?: ListTransactionsPagination;
  /** List of errors encountered during the request */
  errors?: string[];
}

export interface ListTransactionsPagination {
  cursor?: string;
}

export interface GetTransactionByHashRequest {
  /**
   * Wallet address to fetch transactions for
   *
   * examples: "0x742D35Cc6634C0532925a3b8D404020ae0e4f5f3", "0x8ba1f109551bD432803012645Hac136c78baae"
   */
  address: string;
  /**
   * Comma-separated list of blockchain chain IDs to filter transactions by
   *
   * examples: "1,137,56,42161"
   */
  chainIds: string;
  /**
   * Transaction Hash to fetch details for
   *
   * examples: "0x8f4f7c2d..."
   */
  hash: string;
  /**
   * Currency to return transaction values in
   *
   * examples: "usd", "eth", "eur"
   */
  currency: string;
}

export interface GetTransactionByHashResponse {
  /** Metadata about the request */
  metadata: ResponseMetadata | undefined;
  result: TransactionApiResponse | undefined;
  /** List of errors encountered during the request */
  errors: string[];
}
export interface TransactionApiResponse {
  /**
   * Unique transaction identifier
   *
   * examples: "0x8f4f...", "tx_123abc", "internal_456def"
   */
  id: string;
  /**
   * Transaction type
   *
   * examples: "transfer", "swap", "contract_call", "mint"
   */
  type: TransactionType;
  /**
   * Blockchain chain identifier
   *
   * examples: "1", "137", "56", "42161"
   */
  chainId: string;
  /**
   * Network name
   *
   * examples: "mainnet", "testnet", etc
   */
  network: string;
  /**
   * Block number where transaction was mined
   *
   * examples: "18500000", "45000000", "32000000"
   */
  blockNumber: string;
  /**
   * ISO 8601 timestamp when transaction was mined
   *
   * examples: "2025-10-04T03:24:23Z", "2025-10-04T01:54:59Z"
   */
  minedAt: string | undefined;
  /**
   * Transaction status
   *
   * examples: "pending", "confirmed", "failed", "dropped"
   */
  status: TransactionStatus;
  /**
   * Transaction hash
   *
   * examples: "0x1f4f7c2d...", "0x8ba1f109...", "0x742d35cc..."
   */
  hash: string;
  /**
   * Transaction direction relative to the queried address
   *
   * examples: "in", "out", "self"
   */
  direction: string;
  /**
   * Source address of the transaction
   *
   * examples: "0x742D35Cc6634C0532925a3b8D404020ae0e4f5f3"
   */
  addressFrom: string;
  /**
   * Destination address of the transaction
   *
   * examples: "0x8ba1f109551bD432803012645Hac136c78baae"
   */
  addressTo: string;
  /**
   * Transaction nonce
   *
   * examples: "0", "42", "1337", "999999"
   */
  nonce: string;
  /** List of balance changes caused by this transaction */
  changes: Change[];
  /** Transaction fee information */
  fee: Fee | undefined;
  /** Additional transaction metadata */
  meta: Meta | undefined;
}

/**
 * Normalized transaction response with parsed numeric values
 * This is the format used internally after normalizing the raw API response
 */
export interface NormalizedTransactionApiResponse extends Omit<TransactionApiResponse, 'blockNumber' | 'minedAt' | 'nonce'> {
  /**
   * Block number where transaction was mined (parsed as number)
   *
   * examples: 18500000, 45000000, 32000000
   */
  blockNumber: number;
  /**
   * Number of block confirmations
   *
   * examples: 0, 12, 50, 100
   */
  blockConfirmations: number;
  /**
   * Unix timestamp in seconds when transaction was mined
   *
   * examples: 1724463859, 1650000000
   */
  minedAt: number | undefined;
  /**
   * Transaction nonce (parsed as number)
   *
   * examples: 0, 42, 1337, 999999
   */
  nonce: number;
}

export interface Change {
  /** Asset information for this balance change */
  asset: Asset;
  /**
   * Direction of the balance change relative to the address
   *
   * examples: "in", "out", "mint", "burn"
   */
  direction: string;
  /**
   * Source address of the balance change
   *
   * examples: "0x742D35Cc6634C0532925a3b8D404020ae0e4f5f3", "0x0000000000000000000000000000000000000000"
   */
  addressFrom: string;
  /**
   * Destination address of the balance change
   *
   * examples: "0x8ba1f109551bD432803012645Hac136c78baae", "0x742D35Cc6634C0532925a3b8D404020ae0e4f5f3"
   */
  addressTo: string;
  /**
   * Price per unit of the asset in the specified currency
   *
   * examples: "1.00", "3456.78", "0.000001", "45123.45"
   */
  price: string;
  /**
   * Human-readable quantity of the asset
   *
   * examples: "1.5", "1000.0", "0.001", "999999.999999"
   */
  quantity: string;
  /**
   * Raw value in the asset's smallest unit (wei, satoshi, etc.)
   *
   * examples: "1000000000000000000", "500000000", "123456789012345678901234567890"
   */
  value: string;
}

export interface Asset {
  /**
   * Unique asset code identifier
   *
   * examples: "ETH", "USDC", "0x742D35Cc6634C0532925a3b8D404020ae0e4f5f3"
   */
  assetCode?: string;
  /**
   * Number of decimal places for the asset
   *
   * examples: 18, 6, 8, 2
   */
  decimals: number;
  /**
   * URL to the asset's icon image
   *
   * examples: "https://example.com/icons/eth.png", "https://assets.coingecko.com/coins/images/279/large/ethereum.png"
   */
  iconUrl: string;
  /**
   * Full name of the asset
   *
   * examples: "Ethereum", "USD Coin", "Bitcoin", "Chainlink Token"
   */
  name: string;
  /**
   * Network name where the asset exists
   *
   * examples: "mainnet", "testnet", etc
   */
  network: string;
  /**
   * Blockchain chain identifier
   *
   * examples: "1", "137", "56", "42161"
   */
  chainId: string;
  /** Current price information for the asset */
  price?: Price | undefined;
  /**
   * Asset symbol/ticker
   *
   * examples: "ETH", "USDC", "BTC", "LINK"
   */
  symbol: string;
  /**
   * Asset type classification
   *
   * examples: "native", "erc20", "erc721", "erc1155", "bep20"
   */
  type: string;
  /**
   * Token interface standard
   *
   * examples: "ERC20", "ERC721", "ERC1155", "BEP20"
   */
  interface?: string;
  /** Color scheme for UI display */
  colors?: Colors | undefined;
  /** Asset information across different networks */
  networks?: NetworkMapping[];
  /** Bridging information for cross-chain transfers */
  bridging?: TokenBridging | undefined;
  /**
   * Whether this asset should be hidden from UI (internal use)
   *
   * examples: true, false
   */
  trash?: boolean;
  /**
   * Whether this asset is likely spam or fraudulent
   *
   * examples: true, false
   */
  probableSpam?: boolean;
  /**
   * Unique token identifier for NFTs
   *
   * examples: "1", "42", "9999", "0x123abc"
   */
  tokenId?: string;
  /**
   * Whether this asset has been verified by the platform
   *
   * examples: true, false
   */
  verified?: boolean;
  /**
   * Whether this represents a DeFi position rather than a transferable asset
   *
   * examples: true, false
   */
  defiPosition?: boolean;
  /**
   * Whether this asset can be transferred (null means unknown)
   *
   * examples: true, false
   * Note: Use has_transferable to check if value is set
   */
  transferable?: boolean;
  hasTransferable?: boolean;
  /**
   * ISO 8601 timestamp when the asset was created
   *
   * examples: "2023-12-25T10:30:00Z", "2021-01-01T00:00:00Z"
   */
  creationDate?: Date | undefined;
}

export interface NetworkMapping {
  /**
   * Chain ID for this network mapping
   *
   * examples: "1", "137", "56"
   */
  chainId: string;
  /** Token mapping information for this network */
  tokenMapping: TokenMapping | undefined;
}

export interface Price {
  /**
   * Current price value in the specified currency
   *
   * examples: "3456.78", "1.00", "0.000001", "45123.45"
   */
  value: string;
  /**
   * ISO 8601 timestamp when the price was last updated
   *
   * examples: "2025-05-21T00:00:00Z", "2025-12-31T23:59:59Z"
   */
  changedAt: string | undefined;
  /**
   * 24-hour percentage change in price
   *
   * examples: "-2.32", "0.01", "500.00", "-15.67"
   */
  relativeChange24h: string;
}

export interface Colors {
  /**
   * Primary color for UI theming (hex color code)
   *
   * examples: "#FF5733", "#1E88E5", "#4CAF50"
   */
  primary: string;
  /**
   * Fallback color when primary is not available (hex color code)
   *
   * examples: "#CCCCCC", "#757575", "#E0E0E0"
   */
  fallback: string;
  /**
   * Shadow color for UI effects (hex color code)
   *
   * examples: "#000000", "#424242", "#9E9E9E"
   */
  shadow?: string;
}

export interface TokenMapping {
  /**
   * Contract address of the token on this network
   *
   * examples: "0x742D35Cc6634C0532925a3b8D404020ae0e4f5f3", "0xA0b86a33E6417c38b4F4d08c56E8BbE9cB90D1B4"
   */
  address: string;
  /**
   * Number of decimal places for the token
   *
   * examples: 18, 6, 8, 2
   */
  decimals: number;
}

export interface TokenBridging {
  /**
   * Whether this token can be bridged across networks
   *
   * examples: true, false
   */
  bridgeable: boolean;
  /** Networks where this token can be bridged to/from */
  networks: BridgeableNetworkMapping[];
}

export interface BridgeableNetworkMapping {
  /**
   * Chain ID for this bridgeable network
   *
   * examples: "1", "137", "56", "42161"
   */
  chainId: string;
  /** Bridging configuration for this network */
  bridgeableNetwork: BridgeableNetwork | undefined;
}

export interface BridgeableNetwork {
  /**
   * Whether bridging is available on this specific network
   *
   * examples: true, false
   */
  bridgeable: boolean;
}

export interface Fee {
  /**
   * Total fee value in the smallest unit (wei, gwei, etc.)
   *
   * examples: "1000000000000000000", "500000000", "123456789012345678901234567890"
   */
  value: string;
  /**
   * Fee value in the specified currency (USD, ETH, etc.)
   *
   * examples: "12.45", "0.003", "156.78", "0.000123"
   */
  price: string;
  /** Detailed fee breakdown information */
  details: FeeDetail | undefined;
}

export interface FeeDetail {
  /**
   * Fee type identifier
   *
   * examples: 0, 1, 2 (representing legacy, EIP-1559, etc.)
   */
  type: number;
  /**
   * Human-readable fee type label
   *
   * examples: "Legacy", "EIP-1559", "London", "Type-2"
   */
  typeLabel: string;
  /**
   * Gas price in wei
   *
   * examples: "20000000000", "50000000000", "100000000000"
   */
  gasPrice: string;
  /**
   * Maximum gas units allowed for the transaction
   *
   * examples: "21000", "100000", "500000", "1000000"
   */
  gasLimit: string;
  /**
   * Actual gas units consumed by the transaction
   *
   * examples: "21000", "85432", "234567", "999999"
   */
  gasUsed: string;
  /**
   * Maximum fee per gas unit in wei (EIP-1559)
   *
   * examples: "30000000000", "75000000000", "120000000000"
   */
  maxFee: string;
  /**
   * Maximum priority fee per gas unit in wei (EIP-1559)
   *
   * examples: "2000000000", "5000000000", "10000000000"
   */
  maxPriorityFee: string;
  /**
   * Base fee per gas unit in wei (EIP-1559)
   *
   * examples: "15000000000", "25000000000", "45000000000"
   */
  baseFee: string;
  /**
   * Maximum base fee per gas unit in wei
   *
   * examples: "20000000000", "35000000000", "60000000000"
   */
  maxBaseFee: string;
  /** Additional fee details for Layer 2 rollup networks */
  rollupFeeDetails: RollupFeeDetails | undefined;
}

export interface RollupFeeDetails {
  /**
   * Layer 1 fee component in wei
   *
   * examples: "1000000000000000", "500000000000000", "2500000000000000"
   */
  l1Fee: string;
  /**
   * Layer 1 fee scalar multiplier
   *
   * examples: "0.684", "1.0", "1.25", "0.5"
   */
  l1FeeScalar: string;
  /**
   * Layer 1 gas price in wei
   *
   * examples: "20000000000", "35000000000", "50000000000"
   */
  l1GasPrice: string;
  /**
   * Layer 1 gas units used
   *
   * examples: "21000", "68000", "150000", "300000"
   */
  l1GasUsed: string;
  /**
   * Layer 2 fee component in wei
   *
   * examples: "100000000000000", "250000000000000", "750000000000000"
   */
  l2Fee: string;
}

export interface Meta {
  /**
   * Action performed in the transaction
   *
   * examples: "transfer", "approve", "swap", "mint", "burn"
   */
  action: string;
  /**
   * Name of the contract involved in the transaction
   *
   * examples: "Uniswap V3", "OpenSea", "USDC Token", "Compound"
   */
  contractName: string;
  /**
   * Function selector (first 4 bytes of function signature)
   *
   * examples: "0xa9059cbb", "0x095ea7b3", "0x23b872dd", "0x40c10f19"
   */
  fourbyte: string;
  /**
   * URL to the contract's icon image
   *
   * examples: "https://example.com/icons/contract.png", "https://assets.example.com/uniswap.svg"
   */
  contractIconUrl?: string;
  /**
   * Human-readable label for block explorer display
   *
   * examples: "Token Transfer", "Uniswap Swap", "NFT Mint", "Contract Interaction"
   */
  explorerLabel: string;
  /**
   * URL to view transaction details on block explorer
   *
   * examples: "https://etherscan.io/tx/0x123...", "https://polygonscan.com/tx/0x456..."
   */
  explorerUrl: string;
  /** Asset information related to the transaction */
  asset?: Asset | undefined;
  /**
   * Quantity of assets involved in the transaction
   *
   * examples: "1.5", "1000.0", "0.001", "999999.999999", "UNLIMITED"
   */
  quantity?: string;
  /**
   * Address that was approved to spend tokens
   *
   * examples: "0x742D35Cc6634C0532925a3b8D404020ae0e4f5f3", "0x0000000000000000000000000000000000000000"
   */
  approvalTo?: string;
  /**
   * Transaction type classification
   *
   * examples: "transfer", "swap", "approval", "contract_call", "nft_mint"
   */
  type: string;
  /**
   * Transaction subtype for more granular classification
   *
   * examples: "erc20_transfer", "eth_transfer", "nft_sale", "liquidity_add"
   */
  subType?: string;
  /**
   * Public-facing subtype for external display
   *
   * examples: "Token Swap", "NFT Purchase", "Liquidity Provision", "Yield Farming"
   */
  publicSubType?: string;
}

/** ResponseMetadata contains metadata about the response processing */
export interface ResponseMetadata {
  /**
   * Timestamp when the pricing request was initiated.
   *
   * Format: RFC3339/ISO 8601
   * Example: "2025-06-11T10:00:00Z"
   */
  requestTime: string | undefined;
  /**
   * Timestamp when the pricing response was generated.
   *
   * Format: RFC3339/ISO 8601
   * Example: "2025-06-11T10:00:01Z"
   */
  responseTime: string | undefined;
  /**
   * Unique request ID for tracing
   *
   * Example: "req_1234567890abcdef"
   */
  requestId: string;
  /**
   * Currency code for pricing (ISO 4217)
   *
   * Examples: "USD", "EUR", "GBP"
   */
  currency?: string | undefined;
  /**
   * Flag indicating whether the pricing response was successful
   *
   * true  → response is valid and complete
   * false → error occurred while fetching pricing data
   */
  success?: boolean | undefined;
  /**
   * Version of the pricing service or schema
   *
   * Example: "v1.2.3"
   */
  version?: string | undefined;
  /** Pagination information */
  pagination?: PaginationResponse | undefined;
}

/** Pagination Response Information */
export interface PaginationResponse {
  next?: string | undefined;
}
