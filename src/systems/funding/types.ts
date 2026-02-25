import { type Signer } from '@ethersproject/abstract-signer';
import { type Address } from 'viem';
import { type DerivedValue, type SharedValue } from 'react-native-reanimated';
import { type CrosschainQuote, type Quote, type Source } from '@rainbow-me/swaps';
import { type AddressOrEth, type ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { type GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { type GasSpeed } from '@/__swaps__/types/gas';
import { type ChainId } from '@/state/backendNetworks/types';
import { type BaseRainbowStore, type DerivedStore, type RainbowStore } from '@/state/internal/types';
import { type QueryStore, type StoreState } from '@/state/internal/queryStore/types';
import { type StoreActions } from '@/state/internal/utils/createStoreActions';
import { type NumberPadField } from '@/features/perps/components/NumberPad/NumberPadKey';

// ============ Shared Types =================================================== //

/**
 * Configuration for refreshing stores after transaction confirmation.
 *
 * For same-chain transactions, a single immediate refresh is usually sufficient.
 * For cross-chain transactions, multiple delayed refreshes compensate for variable
 * bridge latency—the destination balance may not update until the bridge completes.
 */
export type RefreshConfig = {
  /**
   * Delays (in ms) after confirmation to invoke `handler`.
   * Use `0` for immediate refresh; add subsequent delays for bridges.
   * @example [0, time.seconds(30), time.seconds(60)]
   */
  delays: number[];
  /**
   * Refresh function invoked once per delay after confirmation.
   * Typically calls `fetch(undefined, { force: true })` on relevant stores.
   */
  handler: () => Promise<void>;
};

// ============ Deposit Configuration ========================================== //

/**
 * Callback invoked immediately after transaction submission, before confirmation.
 * Runs fire-and-forget; errors are logged but do not block navigation.
 *
 * Use for setup that must happen right away, such as deploying a proxy wallet
 * or pre-approving token spending.
 */
export type OnDepositSubmit = (signer: Signer) => Promise<void>;

export type DepositSuccessMetadata = {
  /** Amount deposited in source asset units */
  amount: string;
  /** Chain of the source asset */
  assetChainId: ChainId;
  /** Symbol of the source asset */
  assetSymbol: string;
  /** Execution path taken */
  executionStrategy: 'crosschainSwap' | 'directTransfer' | 'swap';
};

export type DepositFailureMetadata = {
  /** Amount attempted, if available */
  amount?: string;
  /** Chain of the source asset, if available */
  assetChainId?: ChainId;
  /** Symbol of the source asset, if available */
  assetSymbol?: string;
  /** Internal error message */
  error: string;
  /** Point in the flow where failure occurred */
  stage: 'execution' | 'validation' | 'wallet';
};

/**
 * Token the user is depositing into.
 */
export type DepositToken = {
  /** Contract address */
  address: Address;
  /** Token decimal places */
  decimals: number;
  /** Token ticker symbol */
  symbol: string;
  /**
   * Override symbol for display (e.g., `'USDC'` instead of `'USDC.e'`).
   * Falls back to `symbol` when omitted.
   */
  displaySymbol?: string;
  /** URL for token icon display */
  iconUrl?: string;
};

/**
 * ### `DepositConfig`
 *
 * Configuration for the deposit flow. Defines where funds go, quote behavior,
 * execution strategy, and post-deposit actions.
 *
 * ---
 * @example
 * ```ts
 * const config = createDepositConfig({
 *   id: 'polymarket',
 *   to: {
 *     chainId: ChainId.polygon,
 *     token: { address: USDC_ADDRESS, decimals: 6, symbol: 'USDC' },
 *     recipient: useProxyAddressStore,
 *   },
 *   quote: { slippage: 1 },
 *   directTransferEnabled: true,
 *   onSubmit: deployProxyIfNeeded,
 *   refresh: {
 *     delays: [0, time.seconds(30)],
 *     handler: refetchBalanceStores,
 *   },
 * });
 * ```
 */
export type DepositConfig = {
  /** Unique identifier for logging and analytics */
  id: string;

  /** Destination for deposited funds */
  to: {
    /** Target chain */
    chainId: ChainId;
    /** Token to receive */
    token: DepositToken;
    /**
     * Store providing the recipient address.
     * When set, deposits route to this address instead of the user's wallet.
     * If configured, deposits will fail when the store returns null.
     */
    recipient?: DerivedStore<Address | null>;
  };

  /** Quote fetching configuration */
  quote?: {
    /** Fee in basis points. @default 0 */
    feeBps?: number;
    /** Slippage tolerance percentage. Defaults to per-chain setting. */
    slippage?: number;
    /** Preferred quote source */
    source?: Source;
  };

  /**
   * Enable direct ERC20 transfer when source asset matches target exactly.
   * Cheaper and faster than routing through the swap aggregator.
   * @default false
   */
  directTransferEnabled?: boolean;

  /** Callback invoked immediately after transaction submission */
  onSubmit?: OnDepositSubmit;

  /** Store refresh behavior after confirmation */
  refresh?: RefreshConfig;

  /** Track failed deposit attempts */
  trackFailure?: (metadata: DepositFailureMetadata) => void;

  /** Track successful deposit completions */
  trackSuccess?: (metadata: DepositSuccessMetadata) => void;
};

// ============ Quote Status =================================================== //

export enum DepositQuoteStatus {
  Error = 'error',
  InsufficientBalance = 'insufficientBalance',
  InsufficientGas = 'insufficientGas',
  Pending = 'pending',
  Success = 'success',
  ZeroAmountError = 'errorZeroAmount',
}

// ============ Store Types ==================================================== //

export type DepositStoreState = {
  asset: ExtendedAnimatedAssetWithColors | null;
  gasSpeed: GasSpeed;
  getAsset: () => ExtendedAnimatedAssetWithColors | null;
  getAssetChainId: () => ChainId;
  getAssetDecimals: () => number;
  getGasSpeed: () => GasSpeed;
  getListChainId: () => ChainId | undefined;
  hasAsset: () => boolean;
  listChainId: ChainId | undefined;
  setAsset: (asset: ExtendedAnimatedAssetWithColors | null) => void;
  setGasSpeed: (gasSpeed: GasSpeed) => void;
  setListChainId: (chainId: ChainId | undefined) => void;
};

export type DepositStoreType = RainbowStore<DepositStoreState>;

// ============ Amount Store Types ============================================= //

/**
 * Generic amount state for both deposit and withdrawal flows.
 */
export type AmountState = {
  amount: string;
  isZero: () => boolean;
  setAmount: (amount: string) => void;
};

export type AmountStoreType = RainbowStore<AmountState>;

export type DepositQuoteStoreParams = {
  accountAddress: Address;
  amount: string;
  asset: {
    address: AddressOrEth;
    balance: string;
    chainId: ChainId;
    decimals: number;
    icon_url?: string;
    name?: string;
    price?: { value: number };
    symbol?: string;
    isNativeAsset: boolean;
  } | null;
  recipient: Address | null;
};

export type DepositQuoteResult =
  | Quote
  | CrosschainQuote
  | DepositQuoteStatus.Error
  | DepositQuoteStatus.InsufficientBalance
  | DepositQuoteStatus.InsufficientGas
  | null;

export type DepositQuoteStoreType = QueryStore<DepositQuoteResult, DepositQuoteStoreParams>;

// ============ Gas Store Types ================================================ //

export type DepositGasLimitParams = {
  assetToSellUniqueId: string | null;
  quoteKey: number | null;
};

export type DepositMeteorologyParams = {
  chainId: ChainId;
};

export type DepositGasSuggestions = {
  [key in GasSpeed]: key extends GasSpeed.CUSTOM ? GasSettings | undefined : GasSettings;
};

export type DepositMeteorologyActions = {
  getGasSuggestions: () => DepositGasSuggestions | undefined;
};

export type DepositGasStoresType = {
  useEstimatedGasFee: DerivedStore<string | undefined>;
  useGasLimitStore: QueryStore<string, DepositGasLimitParams>;
  useGasSettings: DerivedStore<GasSettings | undefined>;
  useMaxSwappableAmount: DerivedStore<string | undefined>;
  useMeteorologyStore: QueryStore<DepositGasSuggestions, DepositMeteorologyParams, DepositMeteorologyActions>;
};

// ============ Amount To Receive Store ======================================== //

export type FormattedQuoteResult =
  | {
      formattedAmount: null;
      status:
        | DepositQuoteStatus.Error
        | DepositQuoteStatus.InsufficientBalance
        | DepositQuoteStatus.InsufficientGas
        | DepositQuoteStatus.Pending
        | DepositQuoteStatus.ZeroAmountError;
    }
  | {
      formattedAmount: string;
      status: DepositQuoteStatus.Success;
    };

export type DepositAmountToReceiveStore = DerivedStore<FormattedQuoteResult>;

// ============ Minified Asset ================================================= //

export type MinifiedAsset = Pick<
  ExtendedAnimatedAssetWithColors,
  'balance' | 'highContrastColor' | 'mixedShadowColor' | 'name' | 'symbol' | 'textColor' | 'uniqueId'
> | null;

// ============ Controller Types =============================================== //

export type InputMethod = 'inputAmount' | 'inputNativeValue';
export type InteractionSource = 'numberpad' | 'slider';

// ============ Screen Theme Types ============================================= //

/**
 * Theme configuration for deposit and withdrawal screens.
 *
 * Accent color can be specified in two ways:
 * - **Single accent** — Use `accent` for both light and dark modes.
 * - **Mode-specific** — Use `accentDark` and `accentLight` for different values per mode.
 */
export type FundingScreenTheme = {
  backgroundDark: string;
  backgroundLight: string;
} & (
  | {
      accent?: undefined;
      accentDark: string;
      accentLight: string;
    }
  | {
      accent: string;
      accentDark?: undefined;
      accentLight?: undefined;
    }
);

/**
 * Resolves the accent color from a theme based on the current color mode.
 */
export function getAccentColor(theme: FundingScreenTheme, isDarkMode: boolean): string {
  return theme.accent ?? (isDarkMode ? theme.accentDark : theme.accentLight);
}

// ============ Context Type =================================================== //

export type DepositContextType = {
  config: DepositConfig;
  depositActions: StoreActions<AmountStoreType & DepositStoreType>;
  displayedAmount: SharedValue<string>;
  displayedNativeValue: SharedValue<string>;
  fields: SharedValue<Record<string, NumberPadField>>;
  gasStores: DepositGasStoresType;
  handleDeposit: () => Promise<void>;
  handleInputMethodChangeWorklet: () => void;
  handleNumberPadChange: (fieldId: string, newValue: string | number) => void;
  handlePressMaxWorklet: () => void;
  handleSliderBeginWorklet: () => void;
  inputMethod: SharedValue<InputMethod>;
  interactionSource: SharedValue<InteractionSource>;
  isSubmitting: SharedValue<boolean>;
  minifiedAsset: DerivedValue<MinifiedAsset>;
  primaryFormattedInput: DerivedValue<string>;
  quoteActions: StoreActions<DepositQuoteStoreType>;
  secondaryFormattedInput: DerivedValue<string>;
  setInputAmounts: (params: { assetDecimals: number; assetPrice: number; maxSwappableAmount: string; progress: number }) => void;
  sliderProgress: SharedValue<number>;
  theme: FundingScreenTheme;
  useAmountStore: AmountStoreType;
  useAmountToReceive: DepositAmountToReceiveStore;
  useDepositStore: DepositStoreType;
  useQuoteStore: DepositQuoteStoreType;
};

// ============ Withdrawal Configuration ======================================= //

/**
 * Constraint for stores compatible with the withdrawal flow.
 * Must expose a `getBalance` method returning the available balance as a string.
 */
export type BalanceQueryStore = BaseRainbowStore<{
  getBalance: () => string;
  getStatus: StoreState<unknown, Record<string, unknown>>['getStatus'];
}>;

/**
 * Anchor for resolving a token across chains.
 * The metadata API uses this to look up addresses on other networks.
 */
export type TokenAnchor = {
  address: AddressOrEth;
  chainId: ChainId;
  symbol: string;
};

/**
 * Chain information passed to the executor when routing is enabled.
 */
export type WithdrawalChainInfo = {
  chainId: ChainId;
  /** Token address on the selected chain */
  tokenAddress: AddressOrEth;
};

/**
 * Routing configuration for multi-chain withdrawals.
 */
export type RouteConfig = {
  /** Source of funds for swap/bridge quotes */
  from: {
    /** Store providing the sender address (e.g., proxy wallet) */
    addressStore: DerivedStore<Address | null>;
    /** Chain where funds are held */
    chainId: ChainId;
    /** Token being sent */
    token: {
      address: Address;
      decimals: number;
    };
  };
  /** Destination configuration */
  to: {
    /** Restrict to specific chains */
    allowedChains?: ChainId[];
    /** Initially selected chain. Supports a getter for dynamic resolution at screen mount. */
    defaultChain: ChainId | (() => ChainId);
    /**
     * Allow swapping on the origin chain when `to.token` differs from `from.token`.
     * Only relevant when the destination token requires a swap.
     * @default false
     */
    enableSameChainSwap?: boolean;
    /**
     * Whether to remember the last selected chain for this withdrawal flow.
     * @default false
     */
    persistSelectedChain?: boolean;
    /** Token user receives. Its `networks` map determines available chains. */
    token: TokenAnchor;
  };
  /** Quote fetching settings */
  quote?: {
    /** Fee in basis points */
    feeBps?: number;
    /** Slippage tolerance percentage */
    slippage?: number;
    /** Preferred quote source */
    source?: Source;
  };
};

/**
 * Title configuration for the withdrawal info card.
 *
 * - **String** — Renders with uniform styling.
 * - **Object** — Renders `prefix` in a dimmer color, `highlighted` in a brighter color.
 *
 * @example
 * // Plain title
 * title: 'Withdrawing to Polygon'
 *
 * // Highlighted title
 * title: { prefix: 'Withdrawing to ', highlighted: 'Polygon' }
 */
export type WithdrawalInfoCardTitle =
  | string
  | {
      /** Text before the highlighted portion (rendered dimmer) */
      prefix: string;
      /** Emphasized text (rendered brighter) */
      highlighted: string;
    };

/**
 * Configuration for the info card displayed above the slider on the withdrawal screen.
 * Pass `null` to hide the card entirely.
 */
export type WithdrawalInfoCardConfig = {
  /** Explanatory text displayed below the title */
  description: string;
  /** SF Symbol displayed before the title. */
  icon?: string;
  /** Card title. Supports optional highlighting via object form. */
  title: WithdrawalInfoCardTitle;
} | null;

/** @deprecated Use `RefreshConfig` instead */
export type WithdrawalRefreshConfig = RefreshConfig;

// ============ Withdrawal Execution Types ===================================== //

/**
 * Result from a successful withdrawal execution.
 */
export type WithdrawalExecutionSuccess = {
  success: true;
  /**
   * Optional callback to wait for transaction confirmation.
   * When provided, refresh scheduling waits for this to resolve.
   * For relayer-based flows, this would be `response.wait()`.
   */
  waitForConfirmation?: () => Promise<void>;
};

/**
 * Result from a failed withdrawal execution.
 */
export type WithdrawalExecutionFailure = {
  /**
   * Error message for user display.
   * Use 'handled' if error was already shown to user (e.g. via Alert).
   */
  error: string;
  success: false;
};

/**
 * Discriminated union for withdrawal execution results.
 */
export type WithdrawalExecutionResult = WithdrawalExecutionFailure | WithdrawalExecutionSuccess;

/**
 * Parameters passed to the withdrawal executor function.
 * The framework validates these before calling the executor.
 */
export type WithdrawalExecutorParams = {
  /** Sanitized amount to withdraw */
  amount: string;
  /** Chain info when multi-network is enabled */
  chainInfo?: WithdrawalChainInfo;
  /** Quote for swap/bridge execution when required */
  quote?: WithdrawalSwapQuote;
  /** Destination address for withdrawn funds */
  recipient: Address;
};

/**
 * Executor function type for withdrawal implementations.
 *
 * The executor is responsible ONLY for:
 * - Building and submitting the transaction(s)
 * - Returning success/failure result
 *
 * The framework handles:
 * - Submitting state management
 * - Navigation (goBack)
 * - Refresh scheduling
 * - Error display (unless error is 'handled')
 */
export type WithdrawalExecutor = (params: WithdrawalExecutorParams) => Promise<WithdrawalExecutionResult>;

/**
 * Optional async prerequisite that runs before transaction submission.
 * Use for setup like deploying proxy wallets or pre-approving tokens.
 * Errors thrown here abort the withdrawal with an error alert.
 */
export type WithdrawalPrerequisite = () => Promise<void>;

/**
 * Metadata passed to the withdrawal success callback.
 */
export type WithdrawalSuccessMetadata = {
  /** Amount withdrawn */
  amount: string;
  /** Target chain for routed withdrawals */
  targetChainId?: ChainId;
};

/**
 * Metadata passed to the withdrawal failure callback.
 */
export type WithdrawalFailureMetadata = {
  /** Amount attempted, if available */
  amount?: string;
  /** Internal error message */
  error: string;
  /** Point in the flow where failure occurred */
  stage: 'execution' | 'prerequisite' | 'validation';
  /** Target chain, if available */
  targetChainId?: ChainId;
};

// ============ Withdrawal Configuration ======================================= //

/**
 * ### `WithdrawalConfig`
 *
 * Configuration for the withdrawal flow.
 *
 * The framework handles coordination (state, navigation, errors, refresh).
 * Implementers provide an executor that ONLY builds and submits transactions.
 *
 * ---
 * @example
 * ```ts
 * const config: WithdrawalConfig<typeof useBalanceStore> = {
 *   id: 'polymarket',
 *   balanceStore: usePolymarketBalanceStore,
 *   amountDecimals: 2,
 *
 *   route: {
 *     from: {
 *       addressStore: useProxyAddress,
 *       chainId: ChainId.polygon,
 *       token: { address: POLYGON_USDC, decimals: 6 },
 *     },
 *     to: {
 *       token: { address: USDC, chainId: ChainId.mainnet, symbol: 'USDC' },
 *       defaultChain: ChainId.polygon,
 *     },
 *     quote: { slippage: 1 },
 *   },
 *
 *   executor: executeWithdrawal,
 *   prerequisite: ensureProxyDeployed,
 *   refresh: { delays: [0, 30000], handler: refetchStores },
 * };
 * ```
 */
export type WithdrawalConfig<TBalanceStore extends BalanceQueryStore> = {
  /** Unique identifier for this withdrawal configuration */
  id: string;

  /** Store providing the withdrawable balance */
  balanceStore: TBalanceStore;

  /** Decimal precision for amount display */
  amountDecimals: number;

  /**
   * Routing configuration for multi-chain withdrawals.
   * Omit for simple same-chain transfer to user's wallet.
   */
  route?: RouteConfig;

  /** Submits the withdrawal transaction(s) */
  executor: WithdrawalExecutor;

  /** Info card displayed above the slider */
  infoCard?: WithdrawalInfoCardConfig;

  /** Async setup before execution (e.g., deploy proxy wallet) */
  prerequisite?: WithdrawalPrerequisite;

  /** Store refresh after confirmation */
  refresh?: RefreshConfig;

  /** Track failed withdrawal attempts */
  trackFailure?: (metadata: WithdrawalFailureMetadata) => void;

  /** Track successful withdrawal completions */
  trackSuccess?: (metadata: WithdrawalSuccessMetadata) => void;
};

// ============ Withdrawal Store Types ========================================= //

export type WithdrawalStoreState = {
  isSubmitting: boolean;
  /** Selected chain for withdrawal. Present when config.chains is defined. */
  selectedChainId: ChainId | undefined;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setSelectedChainId: (chainId: ChainId) => void;
};

export type WithdrawalStoreType = RainbowStore<WithdrawalStoreState>;

/**
 * Network info for a token on a specific chain.
 */
export type TokenNetworkInfo = {
  address: AddressOrEth;
  decimals: number;
};

/**
 * Token metadata with network addresses, fetched from the metadata API.
 * Networks are keyed by chain ID strings (from the API response).
 */
export type WithdrawalTokenData = {
  iconUrl?: string;
  networks: { [chainId: string]: TokenNetworkInfo | undefined };
  symbol: string;
};

export type WithdrawalTokenStoreType = QueryStore<WithdrawalTokenData | null, { address: AddressOrEth; chainId: ChainId }>;

// ============ Withdrawal Quote Store Types =================================== //

/**
 * Swap quote used by withdrawals when swaps are enabled.
 * Same-chain withdrawals use `Quote`; cross-chain withdrawals use `CrosschainQuote`.
 */
export type WithdrawalSwapQuote = Quote | CrosschainQuote;

export enum WithdrawalQuoteStatus {
  Error = 'error',
  InsufficientBalance = 'insufficientBalance',
}

export type WithdrawalQuoteStoreParams = {
  amount: string;
  balance: string;
  buyTokenAddress: Address | null;
  destReceiver: Address;
  sourceAddress: Address | null;
  targetChainId: ChainId | undefined;
};

export type WithdrawalQuoteStoreType = QueryStore<
  WithdrawalSwapQuote | WithdrawalQuoteStatus.InsufficientBalance | null,
  WithdrawalQuoteStoreParams
>;

// ============ Withdrawal Context Type ======================================== //

type WithdrawalContextBase<TBalanceStore extends BalanceQueryStore> = {
  amountActions: StoreActions<AmountStoreType>;
  config: WithdrawalConfig<TBalanceStore>;
  theme: FundingScreenTheme;
  useAmountStore: AmountStoreType;
  useWithdrawalStore: WithdrawalStoreType;
  withdrawalActions: StoreActions<WithdrawalStoreType>;
};

export type WithdrawalContextType<TBalanceStore extends BalanceQueryStore> = WithdrawalContextBase<TBalanceStore> &
  (
    | {
        useQuoteStore: WithdrawalQuoteStoreType;
        useTokenStore: WithdrawalTokenStoreType;
      }
    | {
        useQuoteStore?: undefined;
        useTokenStore?: undefined;
      }
  );
