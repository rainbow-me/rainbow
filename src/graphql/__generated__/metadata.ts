import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Any: any;
  Time: any;
  TokenBridging: any;
  TokenNetworks: any;
};

export type Authorization = {
  address: Scalars['String'];
  chainId: Scalars['String'];
  nonce: Scalars['String'];
};

export enum CacheControlScope {
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

export type ClaimablePoints = {
  __typename?: 'ClaimablePoints';
  error?: Maybe<PointsError>;
  meta: PointsMeta;
  user: UserClaimablePoints;
};

export type Colors = {
  __typename?: 'Colors';
  /** Fallback color for secondary UI elements */
  fallback: Scalars['String'];
  /** Primary brand color in hex format (e.g., #FF0000) */
  primary: Scalars['String'];
  /** Shadow color for depth and emphasis */
  shadow: Scalars['String'];
};

/** CompetitionWindow defines a time period for the King of the Hill competition */
export type CompetitionWindow = {
  __typename?: 'CompetitionWindow';
  /** Total duration of the window in seconds */
  durationSeconds: Scalars['Int'];
  /** UTC timestamp when the competition window ends */
  end: Scalars['Int'];
  /** Time interval representation (e.g., "1h", "24h") */
  interval: Scalars['String'];
  /** Whether this is the currently active competition window */
  isActive: Scalars['Boolean'];
  /** How much time is left in the current window */
  secondsRemaining: Scalars['Int'];
  /** UTC timestamp when the competition window begins */
  start: Scalars['Int'];
};

export type Contract = {
  __typename?: 'Contract';
  address: Scalars['String'];
  chainID: Scalars['Int'];
  created?: Maybe<Scalars['Time']>;
  iconURL: Scalars['String'];
  name: Scalars['String'];
  sourceCodeVerified?: Maybe<Scalars['Boolean']>;
  type: Scalars['Int'];
  typeLabel: Scalars['String'];
};

export type ContractFunction = {
  __typename?: 'ContractFunction';
  address?: Maybe<Scalars['String']>;
  chainID: Scalars['Int'];
  hex: Scalars['String'];
  humanText: Scalars['String'];
  text: Scalars['String'];
};

export type CustomNetwork = {
  __typename?: 'CustomNetwork';
  defaultExplorerURL: Scalars['String'];
  defaultRPCURL: Scalars['String'];
  iconURL: Scalars['String'];
  id: Scalars['Int'];
  name: Scalars['String'];
  nativeAsset: CustomNetworkNativeAsset;
  testnet: CustomNetworkTestnet;
};

export type CustomNetworkNativeAsset = {
  __typename?: 'CustomNetworkNativeAsset';
  address: Scalars['String'];
  decimals: Scalars['Int'];
  iconURL: Scalars['String'];
  symbol: Scalars['String'];
};

export type CustomNetworkTestnet = {
  __typename?: 'CustomNetworkTestnet';
  FaucetURL: Scalars['String'];
  isTestnet: Scalars['Boolean'];
  mainnetChainID: Scalars['Int'];
};

export type DApp = {
  __typename?: 'DApp';
  colors: DAppColors;
  description: Scalars['String'];
  iconURL: Scalars['String'];
  name: Scalars['String'];
  report: DAppReport;
  shortName: Scalars['String'];
  status: DAppStatus;
  trending?: Maybe<Scalars['Boolean']>;
  url: Scalars['String'];
};

export type DAppColors = {
  __typename?: 'DAppColors';
  fallback?: Maybe<Scalars['String']>;
  primary: Scalars['String'];
  shadow?: Maybe<Scalars['String']>;
};

export enum DAppRankingPeriod {
  Day = 'DAY',
  Week = 'WEEK'
}

export type DAppReport = {
  __typename?: 'DAppReport';
  url: Scalars['String'];
};

export enum DAppStatus {
  Scam = 'SCAM',
  Unverified = 'UNVERIFIED',
  Verified = 'VERIFIED'
}

export type DAppV2 = {
  __typename?: 'DAppV2';
  /** Canonical name of the DApp protocol */
  canonicalProtocolName: Scalars['String'];
  /** Blockchain network ID where the DApp is deployed */
  chainId: Scalars['Int'];
  /** Color theme configuration for the DApp */
  colors: Colors;
  /** URL to the DApp's logo/icon image */
  iconURL: Scalars['String'];
  /** Unique identifier for the DApp */
  protocolID: Scalars['String'];
  /** Display name of the DApp */
  protocolName: Scalars['String'];
  /** Normalized identifier for the DApp (e.g., 'uniswap', 'aave') */
  protocolNameID: Scalars['String'];
  /** Version of the DApp protocol */
  protocolVersion: Scalars['String'];
  /** Website URL of the DApp */
  siteURL: Scalars['String'];
};

export type DAppV2Result = {
  __typename?: 'DAppV2Result';
  count: Scalars['Int'];
  result: Array<DAppV2>;
};

export enum Device {
  App = 'APP',
  Bx = 'BX'
}

export type DurationSummary = {
  __typename?: 'DurationSummary';
  /** The duration period this summary covers */
  duration: Scalars['String'];
  /** End timestamp of the summary period (Unix timestamp) */
  end: Scalars['Time'];
  /** Start timestamp of the summary period (Unix timestamp) */
  start: Scalars['Time'];
  /** Detailed trade statistics for this duration */
  stats: Stats;
};

export type EnsMarquee = {
  __typename?: 'ENSMarquee';
  accounts?: Maybe<Array<EnsMarqueeAccount>>;
};

export type EnsMarqueeAccount = {
  __typename?: 'ENSMarqueeAccount';
  address: Scalars['String'];
  avatar: Scalars['String'];
  name: Scalars['String'];
};

export type EnsProfile = {
  __typename?: 'ENSProfile';
  address: Scalars['String'];
  chainID: Scalars['Int'];
  fields: Array<EnsProfileField>;
  name: Scalars['String'];
  resolverAddress: Scalars['String'];
  reverseResolverAddress: Scalars['String'];
};

export type EnsProfileField = {
  __typename?: 'ENSProfileField';
  key: Scalars['String'];
  value: Scalars['String'];
};

export type KingOfTheHill = {
  __typename?: 'KingOfTheHill';
  /** The current token in the King of the Hill competition */
  current: KingOfTheHillToken;
  /** The previous token that held the title */
  lastWinner?: Maybe<KingOfTheHillToken>;
};

/**  KingOfTheHill represents token in the King of the Hill competition */
export type KingOfTheHillRankingElem = {
  __typename?: 'KingOfTheHillRankingElem';
  /** Ranking position of the token in the competition */
  rank: Scalars['Int'];
  /**
   * Token details.
   * Note: This object may not resolve all fields defined in the Token type,
   * as only a subset of data is available in this context.
   */
  token: Token;
  /** Current time window for the competition */
  windowTradingVolume: Scalars['String'];
};

export type KingOfTheHillRankings = {
  __typename?: 'KingOfTheHillRankings';
  /** The leaderboard of the King of the Hill competition */
  rankings: Array<KingOfTheHillRankingElem>;
  /** Current time window for the competition */
  window: CompetitionWindow;
};

/** KingOfTheHillToken represents a token in the King of the Hill competition. */
export type KingOfTheHillToken = {
  __typename?: 'KingOfTheHillToken';
  /** Ranking details for the token in the competition */
  rankingDetails: RankingDetails;
  /**
   * Token details.
   * Note: This object may not resolve all fields defined in the Token type,
   * as only a subset of data is available in this context.
   */
  token: Token;
  /** Current time window for the competition */
  window: CompetitionWindow;
};

export type Launchpad = {
  __typename?: 'Launchpad';
  /** The name of the launchpad or associated launch platform. */
  name: Scalars['String'];
  /** Platform associated with the launchpad. */
  platform: Scalars['String'];
  /** URL to the platform's icon or logo. */
  platformIconURL: Scalars['String'];
  /** The protocol or platform powering the launchpad. */
  protocol: Scalars['String'];
  /** URL to the protocol's icon or logo. */
  protocolIconURL: Scalars['String'];
  /** The social interface or community platform associated with the launchpad. */
  socialInterface: Scalars['String'];
  /** URL to the social interface's icon or logo. */
  socialInterfaceIconURL: Scalars['String'];
};

export type LaunchpadResult = {
  __typename?: 'LaunchpadResult';
  /** Token Creator address. */
  creatorAddress: Scalars['String'];
  /** Indicates whether launchpad information is available for this token. */
  isLaunchpadAvailable: Scalars['Boolean'];
  /** launchpad associated with tokens. */
  launchpad?: Maybe<Launchpad>;
};

/** Represents a liquidity pool of Rainbow token, typically pairing the token with another asset. */
export type LiquidityPool = {
  __typename?: 'LiquidityPool';
  /** The contract address of the liquidity pool. */
  address: Scalars['ID'];
  chainId: Scalars['Int'];
  /** The contract address of the first token in the pair. */
  token0Address: Scalars['String'];
  /** The contract address of the second token in the pair (often the base currency like WETH). */
  token1Address: Scalars['String'];
};

/** Represents market data for a token. */
export type MarketData = {
  __typename?: 'MarketData';
  /** Number of unique holders of the token. */
  holders?: Maybe<Scalars['Int']>;
  /** The fully diluted market cap. */
  marketCapFDV: Scalars['String'];
  /** Trading volume for the last 24 hours in USD. */
  volume24h: Scalars['String'];
};

export type Message = {
  method: Scalars['String'];
  params: Array<Scalars['String']>;
};

export type MessageResult = {
  __typename?: 'MessageResult';
  error?: Maybe<TransactionError>;
  report?: Maybe<TransactionReport>;
  scanning?: Maybe<TransactionScanningResult>;
  simulation?: Maybe<TransactionSimulationResult>;
};

export type Mutation = {
  __typename?: 'Mutation';
  claimUserRewards?: Maybe<UserClaimTransaction>;
  onboardPoints?: Maybe<Points>;
  redeemCode?: Maybe<RedeemedPoints>;
};


export type MutationClaimUserRewardsArgs = {
  address: Scalars['String'];
};


export type MutationOnboardPointsArgs = {
  address: Scalars['String'];
  referral?: InputMaybe<Scalars['String']>;
  signature: Scalars['String'];
};


export type MutationRedeemCodeArgs = {
  address: Scalars['String'];
  code: Scalars['String'];
};

export type Network = {
  __typename?: 'Network';
  colors: NetworkColors;
  defaultExplorer: NetworkExplorer;
  defaultRPC: NetworkRpc;
  enabledServices: NetworkEnabledServices;
  favorites: Array<Maybe<NetworkTokenFavorites>>;
  gasUnits: NetworkGasUnits;
  icons: NetworkIcons;
  id: Scalars['ID'];
  internal: Scalars['Boolean'];
  label: Scalars['String'];
  mainnetId: Scalars['ID'];
  name: Scalars['String'];
  nativeAsset: NetworkAsset;
  nativeAssetNeedsApproval: Scalars['Boolean'];
  nativeWrappedAsset: NetworkAsset;
  opStack: Scalars['Boolean'];
  testnet: Scalars['Boolean'];
};

export type NetworkAddys = {
  __typename?: 'NetworkAddys';
  approvals: Scalars['Boolean'];
  assets: Scalars['Boolean'];
  interactionsWith: Scalars['Boolean'];
  positions: Scalars['Boolean'];
  summary: Scalars['Boolean'];
  transactions: Scalars['Boolean'];
};

export type NetworkAsset = {
  __typename?: 'NetworkAsset';
  address: Scalars['String'];
  colors: NetworkAssetColors;
  decimals: Scalars['Int'];
  iconURL: Scalars['String'];
  name: Scalars['String'];
  symbol: Scalars['String'];
};

export type NetworkAssetColors = {
  __typename?: 'NetworkAssetColors';
  fallback: Scalars['String'];
  primary: Scalars['String'];
  shadow: Scalars['String'];
};

export type NetworkColors = {
  __typename?: 'NetworkColors';
  dark: Scalars['String'];
  light: Scalars['String'];
};

export type NetworkDelegation = {
  __typename?: 'NetworkDelegation';
  enabled7702: Scalars['Boolean'];
};

export type NetworkEnabledServices = {
  __typename?: 'NetworkEnabledServices';
  addys: NetworkAddys;
  delegation: NetworkDelegation;
  launcher: NetworkLauncher;
  meteorology: NetworkMeteorology;
  nftProxy: NetworkNftProxy;
  notifications: NetworkNotifications;
  swap: NetworkSwap;
  tokenSearch: NetworkTokenSearch;
};

export type NetworkExplorer = {
  __typename?: 'NetworkExplorer';
  label: Scalars['String'];
  tokenURL: Scalars['String'];
  transactionURL: Scalars['String'];
  url: Scalars['String'];
};

export type NetworkGasBasicUnits = {
  __typename?: 'NetworkGasBasicUnits';
  approval: Scalars['String'];
  eoaTransfer: Scalars['String'];
  swap: Scalars['String'];
  swapPermit: Scalars['String'];
  tokenTransfer: Scalars['String'];
};

export type NetworkGasUnits = {
  __typename?: 'NetworkGasUnits';
  basic: NetworkGasBasicUnits;
  wrapped: NetworkGasWrappedUnits;
};

export type NetworkGasWrappedUnits = {
  __typename?: 'NetworkGasWrappedUnits';
  unwrap: Scalars['String'];
  wrap: Scalars['String'];
};

export type NetworkIcon = {
  __typename?: 'NetworkIcon';
  largeURL: Scalars['String'];
  smallURL: Scalars['String'];
};

export type NetworkIcons = {
  __typename?: 'NetworkIcons';
  badge: NetworkIcon;
  badgeURL: Scalars['String'];
  dark: NetworkIcon;
  light: NetworkIcon;
  uncropped: NetworkIcon;
};

export type NetworkLauncher = {
  __typename?: 'NetworkLauncher';
  v1: NetworkLauncherVersion;
};

export type NetworkLauncherVersion = {
  __typename?: 'NetworkLauncherVersion';
  contractAddress: Scalars['String'];
  enabled: Scalars['Boolean'];
};

export type NetworkMeteorology = {
  __typename?: 'NetworkMeteorology';
  eip1559: Scalars['Boolean'];
  enabled: Scalars['Boolean'];
  legacy: Scalars['Boolean'];
};

export type NetworkNftProxy = {
  __typename?: 'NetworkNFTProxy';
  enabled: Scalars['Boolean'];
};

export type NetworkNotifications = {
  __typename?: 'NetworkNotifications';
  enabled: Scalars['Boolean'];
  transactions: Scalars['Boolean'];
};

export type NetworkRpc = {
  __typename?: 'NetworkRPC';
  enabledDevices: Array<Maybe<Device>>;
  url: Scalars['String'];
};

export type NetworkSwap = {
  __typename?: 'NetworkSwap';
  bridge: Scalars['Boolean'];
  bridgeExactOutput: Scalars['Boolean'];
  enabled: Scalars['Boolean'];
  swap: Scalars['Boolean'];
  swapExactOutput: Scalars['Boolean'];
};

export type NetworkTokenFavorites = {
  __typename?: 'NetworkTokenFavorites';
  address: Scalars['String'];
};

export type NetworkTokenSearch = {
  __typename?: 'NetworkTokenSearch';
  enabled: Scalars['Boolean'];
};

export type NftAllowlist = {
  __typename?: 'NFTAllowlist';
  addresses?: Maybe<Array<Scalars['String']>>;
  chainID: Scalars['Int'];
};

export type Points = {
  __typename?: 'Points';
  error?: Maybe<PointsError>;
  leaderboard: PointsLeaderboard;
  meta: PointsMeta;
  user: PointsUser;
};

export type PointsEarnings = {
  __typename?: 'PointsEarnings';
  total: Scalars['Int'];
};

export type PointsError = {
  __typename?: 'PointsError';
  message: Scalars['String'];
  type: PointsErrorType;
};

export enum PointsErrorType {
  AlreadyClaimed = 'ALREADY_CLAIMED',
  AlreadyUsedCode = 'ALREADY_USED_CODE',
  AwardingNotOngoing = 'AWARDING_NOT_ONGOING',
  BlockedUser = 'BLOCKED_USER',
  ExistingUser = 'EXISTING_USER',
  InvalidRedemptionCode = 'INVALID_REDEMPTION_CODE',
  InvalidReferralCode = 'INVALID_REFERRAL_CODE',
  NoBalance = 'NO_BALANCE',
  NoClaim = 'NO_CLAIM',
  NonExistingUser = 'NON_EXISTING_USER'
}

export type PointsLeaderboard = {
  __typename?: 'PointsLeaderboard';
  accounts?: Maybe<Array<PointsLeaderboardAccount>>;
  stats: PointsLeaderboardStats;
};

export type PointsLeaderboardAccount = {
  __typename?: 'PointsLeaderboardAccount';
  address: Scalars['String'];
  avatarURL: Scalars['String'];
  earnings: PointsLeaderboardEarnings;
  ens: Scalars['String'];
};

export type PointsLeaderboardEarnings = {
  __typename?: 'PointsLeaderboardEarnings';
  total: Scalars['Int'];
};

export type PointsLeaderboardStats = {
  __typename?: 'PointsLeaderboardStats';
  rank_cutoff: Scalars['Int'];
  total_points: Scalars['Int'];
  total_users: Scalars['Int'];
};

export type PointsMeta = {
  __typename?: 'PointsMeta';
  distribution: PointsMetaDistribution;
  rewards: PointsMetaRewards;
  status: PointsMetaStatus;
};

export type PointsMetaDistribution = {
  __typename?: 'PointsMetaDistribution';
  last: PointsMetaLastDistribution;
  next: Scalars['Int'];
};

export type PointsMetaLastDistribution = {
  __typename?: 'PointsMetaLastDistribution';
  ended_at: Scalars['Int'];
  started_at: Scalars['Int'];
};

export type PointsMetaRewards = {
  __typename?: 'PointsMetaRewards';
  total: Scalars['String'];
};

export enum PointsMetaStatus {
  Finished = 'FINISHED',
  Ongoing = 'ONGOING',
  Paused = 'PAUSED'
}

export enum PointsOnboardDisplayType {
  Bonus = 'BONUS',
  NftCollection = 'NFT_COLLECTION',
  UsdAmount = 'USD_AMOUNT'
}

export type PointsOnboarding = {
  __typename?: 'PointsOnboarding';
  categories?: Maybe<Array<PointsOnboardingCategory>>;
  earnings: PointsOnboardingEarnings;
};

export type PointsOnboardingCategory = {
  __typename?: 'PointsOnboardingCategory';
  data: PointsOnboardingCategoryData;
  display_type: PointsOnboardDisplayType;
  earnings: PointsOnboardingEarnings;
  type: Scalars['String'];
};

export type PointsOnboardingCategoryData = {
  __typename?: 'PointsOnboardingCategoryData';
  owned_collections: Scalars['Int'];
  total_collections: Scalars['Int'];
  usd_amount: Scalars['Float'];
};

export type PointsOnboardingEarnings = {
  __typename?: 'PointsOnboardingEarnings';
  total: Scalars['Int'];
};

export type PointsRewards = {
  __typename?: 'PointsRewards';
  claimable: Scalars['String'];
  claimed: Scalars['String'];
  total: Scalars['String'];
};

export type PointsStats = {
  __typename?: 'PointsStats';
  last_airdrop: PointsStatsPositionLastAirdrop;
  last_period: PointsStatsPositionLastPeriod;
  onboarding: PointsStatsOnboarding;
  position: PointsStatsPosition;
  referral: PointsStatsReferral;
};

export type PointsStatsOnboarding = {
  __typename?: 'PointsStatsOnboarding';
  onboarded_at: Scalars['Time'];
};

export type PointsStatsPosition = {
  __typename?: 'PointsStatsPosition';
  current: Scalars['Int'];
  unranked: Scalars['Boolean'];
};

export type PointsStatsPositionLastAirdrop = {
  __typename?: 'PointsStatsPositionLastAirdrop';
  differences: Array<Maybe<PointsStatsPositionLastAirdropDifference>>;
  earnings: PointsEarnings;
  position: PointsStatsPosition;
};

export type PointsStatsPositionLastAirdropDifference = {
  __typename?: 'PointsStatsPositionLastAirdropDifference';
  earnings: PointsEarnings;
  group_id: Scalars['String'];
  type: Scalars['String'];
};

export type PointsStatsPositionLastPeriod = {
  __typename?: 'PointsStatsPositionLastPeriod';
  earnings: PointsEarnings;
  position: PointsStatsPosition;
};

export type PointsStatsReferral = {
  __typename?: 'PointsStatsReferral';
  qualified_referees: Scalars['Int'];
  total_referees: Scalars['Int'];
};

export type PointsUser = {
  __typename?: 'PointsUser';
  earnings: PointsEarnings;
  earnings_by_type: Array<Maybe<PointsUserEarningByType>>;
  onboarding: PointsOnboarding;
  referralCode: Scalars['String'];
  rewards: PointsRewards;
  stats: PointsStats;
};

export type PointsUserEarningByType = {
  __typename?: 'PointsUserEarningByType';
  earnings: PointsEarnings;
  type: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  claimablePoints?: Maybe<ClaimablePoints>;
  contract?: Maybe<Contract>;
  contractFunction?: Maybe<ContractFunction>;
  contracts?: Maybe<Array<Maybe<Contract>>>;
  customNetworks?: Maybe<Array<Maybe<CustomNetwork>>>;
  dApp?: Maybe<DApp>;
  dApps?: Maybe<Array<Maybe<DApp>>>;
  dAppsV2?: Maybe<DAppV2Result>;
  ensMarquee?: Maybe<EnsMarquee>;
  kingOfTheHill?: Maybe<KingOfTheHill>;
  kingOfTheHillLeaderBoard?: Maybe<KingOfTheHillRankings>;
  network?: Maybe<Network>;
  networks?: Maybe<Array<Maybe<Network>>>;
  nftAllowlist?: Maybe<NftAllowlist>;
  points?: Maybe<Points>;
  pointsOnboardChallenge: Scalars['String'];
  redemptionCode?: Maybe<RedemptionCodeInfo>;
  resolveENSProfile?: Maybe<EnsProfile>;
  reverseResolveENSProfile?: Maybe<EnsProfile>;
  rewards?: Maybe<Rewards>;
  simulateMessage?: Maybe<MessageResult>;
  simulateTransactions?: Maybe<Array<Maybe<TransactionResult>>>;
  stats?: Maybe<RainbowTokenStats>;
  token?: Maybe<Token>;
  tokenInteractions?: Maybe<Array<Maybe<TokenInteraction>>>;
  validateReferral?: Maybe<ValidatedReferral>;
};


export type QueryClaimablePointsArgs = {
  address?: InputMaybe<Scalars['String']>;
};


export type QueryContractArgs = {
  address: Scalars['String'];
  chainID: Scalars['Int'];
};


export type QueryContractFunctionArgs = {
  address?: InputMaybe<Scalars['String']>;
  chainID: Scalars['Int'];
  hex: Scalars['String'];
};


export type QueryContractsArgs = {
  chainID?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  typeID?: InputMaybe<Scalars['Int']>;
};


export type QueryCustomNetworksArgs = {
  includeTestnets?: InputMaybe<Scalars['Boolean']>;
};


export type QueryDAppArgs = {
  shortName?: InputMaybe<Scalars['String']>;
  url?: InputMaybe<Scalars['String']>;
};


export type QueryDAppsArgs = {
  period?: InputMaybe<DAppRankingPeriod>;
  trending?: InputMaybe<Scalars['Boolean']>;
};


export type QueryDAppsV2Args = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  protocolIDs?: InputMaybe<Array<Scalars['String']>>;
};


export type QueryKingOfTheHillArgs = {
  currency?: InputMaybe<Scalars['String']>;
};


export type QueryKingOfTheHillLeaderBoardArgs = {
  currency?: InputMaybe<Scalars['String']>;
};


export type QueryNetworkArgs = {
  chainID: Scalars['Int'];
};


export type QueryNetworksArgs = {
  device?: InputMaybe<Device>;
  includeTestnets?: InputMaybe<Scalars['Boolean']>;
};


export type QueryNftAllowlistArgs = {
  chainID: Scalars['Int'];
};


export type QueryPointsArgs = {
  address?: InputMaybe<Scalars['String']>;
};


export type QueryPointsOnboardChallengeArgs = {
  address: Scalars['String'];
  referral?: InputMaybe<Scalars['String']>;
};


export type QueryRedemptionCodeArgs = {
  code: Scalars['String'];
};


export type QueryResolveEnsProfileArgs = {
  chainID: Scalars['Int'];
  fields?: InputMaybe<Array<Scalars['String']>>;
  name: Scalars['String'];
};


export type QueryReverseResolveEnsProfileArgs = {
  address: Scalars['String'];
  chainID: Scalars['Int'];
  fields?: InputMaybe<Array<Scalars['String']>>;
};


export type QueryRewardsArgs = {
  address?: InputMaybe<Scalars['String']>;
  project: RewardsProject;
};


export type QuerySimulateMessageArgs = {
  address: Scalars['String'];
  chainID: Scalars['Int'];
  currency?: InputMaybe<Scalars['String']>;
  domain?: InputMaybe<Scalars['String']>;
  message: Message;
};


export type QuerySimulateTransactionsArgs = {
  chainID: Scalars['Int'];
  currency?: InputMaybe<Scalars['String']>;
  domain?: InputMaybe<Scalars['String']>;
  transactions?: InputMaybe<Array<Transaction>>;
};


export type QueryStatsArgs = {
  address: Scalars['String'];
  chainID: Scalars['Int'];
  currency?: InputMaybe<Scalars['String']>;
};


export type QueryTokenArgs = {
  address: Scalars['String'];
  chainID: Scalars['Int'];
  currency?: InputMaybe<Scalars['String']>;
};


export type QueryTokenInteractionsArgs = {
  address: Scalars['String'];
  chainID: Scalars['Int'];
  currency?: InputMaybe<Scalars['String']>;
  tokenAddress: Scalars['String'];
};


export type QueryValidateReferralArgs = {
  referral: Scalars['String'];
};

export type RainbowTokenDetails = {
  __typename?: 'RainbowTokenDetails';
  /** Information about the primary liquidity pool associated with this token, if available. */
  liquidityPool?: Maybe<LiquidityPool>;
  /** Descriptive metadata associated with the token. */
  metadata?: Maybe<RainbowTokenMetadata>;
  /** Data retrieved directly from the blockchain regarding the token. */
  onchainData?: Maybe<RainbowTokenOnchainData>;
};

/** Contains descriptive metadata for a token. */
export type RainbowTokenMetadata = {
  __typename?: 'RainbowTokenMetadata';
  /** A text description of the token. */
  description?: Maybe<Scalars['String']>;
  /** A URL pointing to the token's logo image. */
  logoUrl?: Maybe<Scalars['String']>;
  /** A URI (often IPFS or HTTP) pointing to more detailed token metadata conforming to a standard (e.g., ERC721/ERC1155). */
  tokenUri?: Maybe<Scalars['String']>;
};

/** Contains data about the token fetched directly from the blockchain. */
export type RainbowTokenOnchainData = {
  __typename?: 'RainbowTokenOnchainData';
  /** The address of the account that originally deployed the token contract. */
  creatorAddress?: Maybe<Scalars['String']>;
  /**
   * The Merkle root hash, often used for verified airdrop distributions.
   * May be zero if not applicable. (Included for completeness, might be niche)
   */
  merkleRoot?: Maybe<Scalars['String']>;
  /** The total supply of the token currently in existence (as a string to handle large numbers). */
  totalSupply: Scalars['String'];
};

export type RainbowTokenStats = {
  __typename?: 'RainbowTokenStats';
  /** Number of data buckets used (meaning might need clarification from source) */
  bucketCount: Scalars['Int'];
  /** Timestamp of the last known transaction included in the summary (Unix timestamp) */
  lastTransaction: Scalars['Time'];
  /** liquidity pool */
  liquidityPool: LiquidityPool;
  /** An array of summaries for different predefined time durations */
  summary: Array<Maybe<DurationSummary>>;
};

export type RankingDetails = {
  __typename?: 'RankingDetails';
  /** Timestamp when this market data was last refreshed */
  lastUpdated: Scalars['Int'];
  /** Metric that determined the winner , supported values are "volume", "latestTransaction", "volume24h"  */
  rankingCriteria: Scalars['String'];
  /** Reason for the token's victory (e.g., "highest volume") */
  rankingCriteriaDesc: Scalars['String'];
  /** Trading volume specific to the current competition window */
  windowTradingVolume: Scalars['String'];
};

export type RedeemedPoints = {
  __typename?: 'RedeemedPoints';
  earnings: RedeemedPointsEarnings;
  error?: Maybe<PointsError>;
  redemption_code: RedemptionCode;
};

export type RedeemedPointsEarnings = {
  __typename?: 'RedeemedPointsEarnings';
  total: Scalars['Int'];
};

export type RedemptionCode = {
  __typename?: 'RedemptionCode';
  code: Scalars['String'];
};

export type RedemptionCodeEarnings = {
  __typename?: 'RedemptionCodeEarnings';
  max: Scalars['Int'];
  min: Scalars['Int'];
  type: RedemptionCodeScoringType;
};

export type RedemptionCodeInfo = {
  __typename?: 'RedemptionCodeInfo';
  earnings: RedemptionCodeEarnings;
  error?: Maybe<PointsError>;
  redemption_code: RedemptionCode;
};

export enum RedemptionCodeScoringType {
  Fixed = 'FIXED',
  Range = 'RANGE',
  Unknown = 'UNKNOWN'
}

export type Rewards = {
  __typename?: 'Rewards';
  earnings?: Maybe<RewardsEarnings>;
  leaderboard: RewardsLeaderboard;
  meta: RewardsMeta;
  stats?: Maybe<RewardStats>;
};

export type RewardsAmount = {
  __typename?: 'RewardsAmount';
  token: Scalars['Float'];
  usd: Scalars['Float'];
};

export type RewardsAsset = {
  __typename?: 'RewardsAsset';
  assetCode: Scalars['String'];
  chainID: Scalars['Int'];
  colors: TokenColors;
  decimals: Scalars['Int'];
  iconURL?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  symbol: Scalars['String'];
};

export type RewardsDailyAmount = {
  __typename?: 'RewardsDailyAmount';
  day: Scalars['Int'];
  token: Scalars['Float'];
  usd: Scalars['Float'];
};

export type RewardsEarnings = {
  __typename?: 'RewardsEarnings';
  daily?: Maybe<Array<RewardsDailyAmount>>;
  multiplier: RewardsEarningsMultiplierMultiplier;
  pending: RewardsAmount;
  total: RewardsAmount;
  updatedAt: Scalars['Int'];
};

export type RewardsEarningsMultiplierBreakdown = {
  __typename?: 'RewardsEarningsMultiplierBreakdown';
  amount: Scalars['Float'];
  qualifier: Scalars['String'];
};

export type RewardsEarningsMultiplierMultiplier = {
  __typename?: 'RewardsEarningsMultiplierMultiplier';
  amount: Scalars['Float'];
  breakdown: Array<RewardsEarningsMultiplierBreakdown>;
};

export type RewardsLeaderboard = {
  __typename?: 'RewardsLeaderboard';
  accounts?: Maybe<Array<RewardsLeaderboardAccount>>;
  updatedAt: Scalars['Int'];
};

export type RewardsLeaderboardAccount = {
  __typename?: 'RewardsLeaderboardAccount';
  address: Scalars['String'];
  avatarURL?: Maybe<Scalars['String']>;
  earnings: RewardsLeaderboardEarnings;
  ens?: Maybe<Scalars['String']>;
};

export type RewardsLeaderboardEarnings = {
  __typename?: 'RewardsLeaderboardEarnings';
  base: RewardsAmount;
  bonus: RewardsAmount;
};

export type RewardsMeta = {
  __typename?: 'RewardsMeta';
  color: Scalars['String'];
  distribution: RewardsMetaDistribution;
  end: Scalars['Int'];
  status: RewardsMetaStatus;
  title: Scalars['String'];
  token: RewardsMetaToken;
};

export type RewardsMetaDistribution = {
  __typename?: 'RewardsMetaDistribution';
  left: Scalars['Float'];
  next: Scalars['Int'];
  total: Scalars['Float'];
};

export enum RewardsMetaStatus {
  Finished = 'FINISHED',
  Ongoing = 'ONGOING',
  Paused = 'PAUSED'
}

export type RewardsMetaToken = {
  __typename?: 'RewardsMetaToken';
  asset: RewardsAsset;
};

export enum RewardsProject {
  Optimism = 'OPTIMISM'
}

export type RewardsStatsPosition = {
  __typename?: 'RewardsStatsPosition';
  change: RewardsStatsPositionChange;
  current: Scalars['Int'];
};

export type RewardsStatsPositionChange = {
  __typename?: 'RewardsStatsPositionChange';
  h24?: Maybe<Scalars['Int']>;
};

export type RewardStats = {
  __typename?: 'RewardStats';
  actions: Array<RewardStatsAction>;
  position: RewardsStatsPosition;
};

export type RewardStatsAction = {
  __typename?: 'RewardStatsAction';
  amount: RewardsAmount;
  rewardPercent: Scalars['Float'];
  type: RewardStatsActionType;
};

export enum RewardStatsActionType {
  Bridge = 'BRIDGE',
  Swap = 'SWAP'
}

export type Stats = {
  __typename?: 'Stats';
  /** Number of unique wallets that bought */
  buyers: Scalars['Int'];
  /** Number of buy transactions */
  buys: Scalars['Int'];
  /** Volume attributed to buy transactions */
  buyVolume: Scalars['Float'];
  /** Price change in percentage (e.g., 5.0 means +5%, -3.2 means -3.2%) */
  priceChangePct: Scalars['Float'];
  /** Number of unique wallets that sold */
  sellers: Scalars['Int'];
  /** Number of sell transactions */
  sells: Scalars['Int'];
  /** Volume attributed to sell transactions */
  sellVolume: Scalars['Float'];
  /** Total number of transactions (buys + sells) */
  transactions: Scalars['Int'];
  /** Number of unique wallets that traded */
  uniques: Scalars['Int'];
  /** Total volume of trades in the specified currency */
  volume: Scalars['Float'];
};

export type Token = {
  __typename?: 'Token';
  address: Scalars['String'];
  allTime: TokenAllTime;
  bridging: Scalars['TokenBridging'];
  chainId: Scalars['Int'];
  circulatingSupply?: Maybe<Scalars['Float']>;
  colors: TokenColors;
  creationDate?: Maybe<Scalars['Time']>;
  decimals: Scalars['Int'];
  description?: Maybe<Scalars['String']>;
  fullyDilutedValuation?: Maybe<Scalars['Float']>;
  iconUrl?: Maybe<Scalars['String']>;
  launchpad?: Maybe<LaunchpadResult>;
  links?: Maybe<TokenLinks>;
  marketCap?: Maybe<Scalars['Float']>;
  /**
   * Grouped market-related for the token.
   *
   * Note: All internal fields related to market performance (e.g., market cap, volume, holders)
   * are being consolidated under this object for better structure and maintainability.
   * Prefer accessing market-related values through this field going forward.
   */
  marketData?: Maybe<MarketData>;
  name: Scalars['String'];
  networks: Scalars['TokenNetworks'];
  price: TokenPrice;
  priceCharts: TokenPriceCharts;
  rainbow: Scalars['Boolean'];
  rainbowTokenDetails?: Maybe<RainbowTokenDetails>;
  status: TokenStatus;
  symbol: Scalars['String'];
  totalSupply?: Maybe<Scalars['Float']>;
  transferable: Scalars['Boolean'];
  type: Scalars['String'];
  volume1d?: Maybe<Scalars['Float']>;
};

export type TokenAllTime = {
  __typename?: 'TokenAllTime';
  highDate?: Maybe<Scalars['Time']>;
  highValue?: Maybe<Scalars['Float']>;
  lowDate?: Maybe<Scalars['Time']>;
  lowValue?: Maybe<Scalars['Float']>;
};

export type TokenColors = {
  __typename?: 'TokenColors';
  fallback?: Maybe<Scalars['String']>;
  primary: Scalars['String'];
  shadow?: Maybe<Scalars['String']>;
};

export type TokenInteraction = {
  __typename?: 'TokenInteraction';
  amount: Scalars['String'];
  chainID: Scalars['Int'];
  direction: TokenInteractionDirection;
  explorerLabel: Scalars['String'];
  explorerURL: Scalars['String'];
  interactedAt: Scalars['Int'];
  price: Scalars['Float'];
  transactionHash: Scalars['String'];
  type: TokenInteractionType;
};

export enum TokenInteractionDirection {
  In = 'IN',
  Out = 'OUT',
  Unknown = 'UNKNOWN'
}

export enum TokenInteractionType {
  Bought = 'BOUGHT',
  Received = 'RECEIVED',
  Sent = 'SENT',
  Sold = 'SOLD',
  Unknown = 'UNKNOWN'
}

export type TokenLink = {
  __typename?: 'TokenLink';
  url: Scalars['String'];
};

export type TokenLinks = {
  __typename?: 'TokenLinks';
  coingecko?: Maybe<TokenLink>;
  facebook?: Maybe<TokenLink>;
  farcaster?: Maybe<TokenLink>;
  homepage?: Maybe<TokenLink>;
  other?: Maybe<TokenLink>;
  rainbow?: Maybe<TokenLink>;
  reddit?: Maybe<TokenLink>;
  telegram?: Maybe<TokenLink>;
  twitter?: Maybe<TokenLink>;
};

export type TokenPrice = {
  __typename?: 'TokenPrice';
  relativeChange24h?: Maybe<Scalars['Float']>;
  updatedAt?: Maybe<Scalars['Time']>;
  value?: Maybe<Scalars['Float']>;
};

export type TokenPriceChart = {
  __typename?: 'TokenPriceChart';
  aggregates?: Maybe<TokenPriceChartAggregates>;
  /**
   * points is an array of [Int, Float] pairs
   *     where the first element is the timestamp and the second is the price
   */
  points?: Maybe<Array<Maybe<Array<Maybe<Scalars['Any']>>>>>;
  /** pricePresentAt time when the price is present for the first time */
  pricePresentAt?: Maybe<Scalars['Time']>;
  timeEnd?: Maybe<Scalars['Time']>;
  timeStart?: Maybe<Scalars['Time']>;
};

export type TokenPriceChartAggregates = {
  __typename?: 'TokenPriceChartAggregates';
  avg?: Maybe<Scalars['Float']>;
  first?: Maybe<Scalars['Float']>;
  last?: Maybe<Scalars['Float']>;
  max?: Maybe<Scalars['Float']>;
  min?: Maybe<Scalars['Float']>;
};

export type TokenPriceCharts = {
  __typename?: 'TokenPriceCharts';
  day?: Maybe<TokenPriceChart>;
  hour?: Maybe<TokenPriceChart>;
  max?: Maybe<TokenPriceChart>;
  month?: Maybe<TokenPriceChart>;
  week?: Maybe<TokenPriceChart>;
  year?: Maybe<TokenPriceChart>;
};

export enum TokenStatus {
  Scam = 'SCAM',
  Unknown = 'UNKNOWN',
  Unverified = 'UNVERIFIED',
  Verified = 'VERIFIED'
}

export type Transaction = {
  authorization_list?: InputMaybe<Array<InputMaybe<Authorization>>>;
  data: Scalars['String'];
  from: Scalars['String'];
  to: Scalars['String'];
  value: Scalars['String'];
};

export enum TransactionAssetInterface {
  Erc1155 = 'ERC1155',
  Erc20 = 'ERC20',
  Erc721 = 'ERC721'
}

export enum TransactionAssetType {
  Native = 'NATIVE',
  Nft = 'NFT',
  Token = 'TOKEN'
}

export type TransactionError = {
  __typename?: 'TransactionError';
  message: Scalars['String'];
  type: TransactionErrorType;
};

export enum TransactionErrorType {
  InsufficientBalance = 'INSUFFICIENT_BALANCE',
  Revert = 'REVERT',
  Unsupported = 'UNSUPPORTED'
}

export type TransactionGasResult = {
  __typename?: 'TransactionGasResult';
  estimate: Scalars['String'];
  used: Scalars['String'];
};

export type TransactionReport = {
  __typename?: 'TransactionReport';
  url: Scalars['String'];
};

export type TransactionResult = {
  __typename?: 'TransactionResult';
  error?: Maybe<TransactionError>;
  gas?: Maybe<TransactionGasResult>;
  report?: Maybe<TransactionReport>;
  scanning?: Maybe<TransactionScanningResult>;
  simulation?: Maybe<TransactionSimulationResult>;
};

export type TransactionScanningResult = {
  __typename?: 'TransactionScanningResult';
  description: Scalars['String'];
  result: TransactionScanResultType;
};

export enum TransactionScanResultType {
  Malicious = 'MALICIOUS',
  Ok = 'OK',
  Warning = 'WARNING'
}

export type TransactionSimulationApproval = {
  __typename?: 'TransactionSimulationApproval';
  asset: TransactionSimulationAsset;
  expiration?: Maybe<Scalars['Time']>;
  quantityAllowed: Scalars['String'];
  quantityAtRisk: Scalars['String'];
  spender: TransactionSimulationTarget;
};

export type TransactionSimulationAsset = {
  __typename?: 'TransactionSimulationAsset';
  assetCode: Scalars['String'];
  creationDate?: Maybe<Scalars['Time']>;
  decimals: Scalars['Int'];
  iconURL: Scalars['String'];
  interface: TransactionAssetInterface;
  name: Scalars['String'];
  network: Scalars['String'];
  status: VerificationStatus;
  symbol: Scalars['String'];
  tokenId: Scalars['String'];
  type: TransactionAssetType;
};

export type TransactionSimulationChange = {
  __typename?: 'TransactionSimulationChange';
  asset: TransactionSimulationAsset;
  price: Scalars['Float'];
  quantity: Scalars['String'];
};

export type TransactionSimulationDelegation = {
  __typename?: 'TransactionSimulationDelegation';
  address: Scalars['String'];
  created?: Maybe<Scalars['Time']>;
  iconURL: Scalars['String'];
  name: Scalars['String'];
  sourceCodeStatus?: Maybe<VerificationStatus>;
};

export type TransactionSimulationMeta = {
  __typename?: 'TransactionSimulationMeta';
  to?: Maybe<TransactionSimulationTarget>;
  transferTo?: Maybe<TransactionSimulationTarget>;
};

export type TransactionSimulationResult = {
  __typename?: 'TransactionSimulationResult';
  approvals?: Maybe<Array<Maybe<TransactionSimulationApproval>>>;
  delegation?: Maybe<TransactionSimulationDelegation>;
  in?: Maybe<Array<Maybe<TransactionSimulationChange>>>;
  meta?: Maybe<TransactionSimulationMeta>;
  out?: Maybe<Array<Maybe<TransactionSimulationChange>>>;
};

export type TransactionSimulationTarget = {
  __typename?: 'TransactionSimulationTarget';
  address: Scalars['String'];
  created?: Maybe<Scalars['Time']>;
  function: Scalars['String'];
  iconURL: Scalars['String'];
  name: Scalars['String'];
  sourceCodeStatus?: Maybe<VerificationStatus>;
};

export type UserClaimablePoints = {
  __typename?: 'UserClaimablePoints';
  earnings: PointsEarnings;
};

export type UserClaimTransaction = {
  __typename?: 'UserClaimTransaction';
  chainID: Scalars['Int'];
  error?: Maybe<PointsError>;
  txHash: Scalars['String'];
  uoHash: Scalars['String'];
};

export type ValidatedReferral = {
  __typename?: 'ValidatedReferral';
  error?: Maybe<PointsError>;
  valid: Scalars['Boolean'];
};

export enum VerificationStatus {
  Unknown = 'UNKNOWN',
  Unverified = 'UNVERIFIED',
  Verified = 'VERIFIED'
}

export type GetContractFunctionQueryVariables = Exact<{
  chainID: Scalars['Int'];
  hex: Scalars['String'];
}>;


export type GetContractFunctionQuery = { __typename?: 'Query', contractFunction?: { __typename?: 'ContractFunction', text: string } | null };

export type GetEnsMarqueeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetEnsMarqueeQuery = { __typename?: 'Query', ensMarquee?: { __typename?: 'ENSMarquee', accounts?: Array<{ __typename?: 'ENSMarqueeAccount', name: string, address: string, avatar: string }> | null } | null };

export type RewardsAmountFragment = { __typename?: 'RewardsAmount', usd: number, token: number };

export type BaseQueryFragment = { __typename?: 'Rewards', meta: { __typename?: 'RewardsMeta', title: string, status: RewardsMetaStatus, end: number, color: string, distribution: { __typename?: 'RewardsMetaDistribution', next: number, total: number, left: number }, token: { __typename?: 'RewardsMetaToken', asset: { __typename?: 'RewardsAsset', assetCode: string, decimals: number, iconURL?: string | null, name: string, chainID: number, symbol: string } } } };

export type GetRewardsDataForWalletQueryVariables = Exact<{
  address: Scalars['String'];
}>;


export type GetRewardsDataForWalletQuery = { __typename?: 'Query', rewards?: { __typename?: 'Rewards', earnings?: { __typename?: 'RewardsEarnings', updatedAt: number, total: { __typename?: 'RewardsAmount', usd: number, token: number }, multiplier: { __typename?: 'RewardsEarningsMultiplierMultiplier', amount: number, breakdown: Array<{ __typename?: 'RewardsEarningsMultiplierBreakdown', amount: number, qualifier: string }> }, pending: { __typename?: 'RewardsAmount', usd: number, token: number }, daily?: Array<{ __typename?: 'RewardsDailyAmount', day: number, usd: number, token: number }> | null } | null, stats?: { __typename?: 'RewardStats', actions: Array<{ __typename?: 'RewardStatsAction', type: RewardStatsActionType, rewardPercent: number, amount: { __typename?: 'RewardsAmount', usd: number, token: number } }> } | null, meta: { __typename?: 'RewardsMeta', title: string, status: RewardsMetaStatus, end: number, color: string, distribution: { __typename?: 'RewardsMetaDistribution', next: number, total: number, left: number }, token: { __typename?: 'RewardsMetaToken', asset: { __typename?: 'RewardsAsset', assetCode: string, decimals: number, iconURL?: string | null, name: string, chainID: number, symbol: string } } } } | null };

export type ReverseResolveEnsProfileQueryVariables = Exact<{
  chainID: Scalars['Int'];
  address: Scalars['String'];
  fields?: InputMaybe<Array<Scalars['String']> | Scalars['String']>;
}>;


export type ReverseResolveEnsProfileQuery = { __typename?: 'Query', reverseResolveENSProfile?: { __typename?: 'ENSProfile', name: string, address: string, resolverAddress: string, reverseResolverAddress: string, chainID: number, fields: Array<{ __typename?: 'ENSProfileField', key: string, value: string }> } | null };

export type GetdAppQueryVariables = Exact<{
  shortName: Scalars['String'];
  url: Scalars['String'];
  status: Scalars['Boolean'];
}>;


export type GetdAppQuery = { __typename?: 'Query', dApp?: { __typename?: 'DApp', name: string, status?: DAppStatus, iconURL: string, url: string, description: string, shortName: string, colors: { __typename?: 'DAppColors', primary: string, fallback?: string | null, shadow?: string | null } } | null };

export type GetdAppsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetdAppsQuery = { __typename?: 'Query', dApps?: Array<{ __typename?: 'DApp', name: string, shortName: string, description: string, url: string, iconURL: string, status: DAppStatus, trending?: boolean | null, colors: { __typename?: 'DAppColors', primary: string, fallback?: string | null, shadow?: string | null }, report: { __typename?: 'DAppReport', url: string } } | null> | null };

export type TransactionSimulationAssetFragment = { __typename?: 'TransactionSimulationAsset', assetCode: string, decimals: number, iconURL: string, name: string, network: string, symbol: string, type: TransactionAssetType, interface: TransactionAssetInterface, tokenId: string, status: VerificationStatus };

export type ChangeFragment = { __typename?: 'TransactionSimulationChange', price: number, quantity: string, asset: { __typename?: 'TransactionSimulationAsset', assetCode: string, decimals: number, iconURL: string, name: string, network: string, symbol: string, type: TransactionAssetType, interface: TransactionAssetInterface, tokenId: string, status: VerificationStatus } };

export type TargetFragment = { __typename?: 'TransactionSimulationTarget', address: string, name: string, iconURL: string, function: string, created?: any | null, sourceCodeStatus?: VerificationStatus | null };

export type SimulationErrorFragment = { __typename?: 'TransactionError', message: string, type: TransactionErrorType };

export type SimulateTransactionsQueryVariables = Exact<{
  chainId: Scalars['Int'];
  transactions?: InputMaybe<Array<Transaction> | Transaction>;
  domain?: InputMaybe<Scalars['String']>;
  currency?: InputMaybe<Scalars['String']>;
}>;


export type SimulateTransactionsQuery = { __typename?: 'Query', simulateTransactions?: Array<{ __typename?: 'TransactionResult', error?: { __typename?: 'TransactionError', message: string, type: TransactionErrorType } | null, scanning?: { __typename?: 'TransactionScanningResult', result: TransactionScanResultType, description: string } | null, gas?: { __typename?: 'TransactionGasResult', used: string, estimate: string } | null, report?: { __typename?: 'TransactionReport', url: string } | null, simulation?: { __typename?: 'TransactionSimulationResult', in?: Array<{ __typename?: 'TransactionSimulationChange', price: number, quantity: string, asset: { __typename?: 'TransactionSimulationAsset', assetCode: string, decimals: number, iconURL: string, name: string, network: string, symbol: string, type: TransactionAssetType, interface: TransactionAssetInterface, tokenId: string, status: VerificationStatus } } | null> | null, out?: Array<{ __typename?: 'TransactionSimulationChange', price: number, quantity: string, asset: { __typename?: 'TransactionSimulationAsset', assetCode: string, decimals: number, iconURL: string, name: string, network: string, symbol: string, type: TransactionAssetType, interface: TransactionAssetInterface, tokenId: string, status: VerificationStatus } } | null> | null, approvals?: Array<{ __typename?: 'TransactionSimulationApproval', quantityAllowed: string, quantityAtRisk: string, asset: { __typename?: 'TransactionSimulationAsset', assetCode: string, decimals: number, iconURL: string, name: string, network: string, symbol: string, type: TransactionAssetType, interface: TransactionAssetInterface, tokenId: string, status: VerificationStatus }, spender: { __typename?: 'TransactionSimulationTarget', address: string, name: string, iconURL: string, function: string, created?: any | null, sourceCodeStatus?: VerificationStatus | null } } | null> | null, meta?: { __typename?: 'TransactionSimulationMeta', transferTo?: { __typename?: 'TransactionSimulationTarget', address: string, name: string, iconURL: string, function: string, created?: any | null, sourceCodeStatus?: VerificationStatus | null } | null, to?: { __typename?: 'TransactionSimulationTarget', address: string, name: string, iconURL: string, function: string, created?: any | null, sourceCodeStatus?: VerificationStatus | null } | null } | null, delegation?: { __typename?: 'TransactionSimulationDelegation', address: string, name: string, iconURL: string, created?: any | null, sourceCodeStatus?: VerificationStatus | null } | null } | null } | null> | null };

export type SimulateMessageQueryVariables = Exact<{
  address: Scalars['String'];
  chainId: Scalars['Int'];
  message: Message;
  domain: Scalars['String'];
}>;


export type SimulateMessageQuery = { __typename?: 'Query', simulateMessage?: { __typename?: 'MessageResult', error?: { __typename?: 'TransactionError', message: string, type: TransactionErrorType } | null, scanning?: { __typename?: 'TransactionScanningResult', result: TransactionScanResultType, description: string } | null, simulation?: { __typename?: 'TransactionSimulationResult', in?: Array<{ __typename?: 'TransactionSimulationChange', price: number, quantity: string, asset: { __typename?: 'TransactionSimulationAsset', assetCode: string, decimals: number, iconURL: string, name: string, network: string, symbol: string, type: TransactionAssetType, interface: TransactionAssetInterface, tokenId: string, status: VerificationStatus } } | null> | null, out?: Array<{ __typename?: 'TransactionSimulationChange', price: number, quantity: string, asset: { __typename?: 'TransactionSimulationAsset', assetCode: string, decimals: number, iconURL: string, name: string, network: string, symbol: string, type: TransactionAssetType, interface: TransactionAssetInterface, tokenId: string, status: VerificationStatus } } | null> | null, approvals?: Array<{ __typename?: 'TransactionSimulationApproval', quantityAllowed: string, quantityAtRisk: string, asset: { __typename?: 'TransactionSimulationAsset', assetCode: string, decimals: number, iconURL: string, name: string, network: string, symbol: string, type: TransactionAssetType, interface: TransactionAssetInterface, tokenId: string, status: VerificationStatus }, spender: { __typename?: 'TransactionSimulationTarget', address: string, name: string, iconURL: string, function: string, created?: any | null, sourceCodeStatus?: VerificationStatus | null } } | null> | null, meta?: { __typename?: 'TransactionSimulationMeta', to?: { __typename?: 'TransactionSimulationTarget', address: string, name: string, iconURL: string, function: string, created?: any | null, sourceCodeStatus?: VerificationStatus | null } | null } | null } | null } | null };

export type GetPointsDataForWalletQueryVariables = Exact<{
  address: Scalars['String'];
}>;


export type GetPointsDataForWalletQuery = { __typename?: 'Query', points?: { __typename?: 'Points', error?: { __typename?: 'PointsError', message: string, type: PointsErrorType } | null, meta: { __typename?: 'PointsMeta', status: PointsMetaStatus, distribution: { __typename?: 'PointsMetaDistribution', next: number }, rewards: { __typename?: 'PointsMetaRewards', total: string } }, leaderboard: { __typename?: 'PointsLeaderboard', stats: { __typename?: 'PointsLeaderboardStats', total_users: number, total_points: number, rank_cutoff: number }, accounts?: Array<{ __typename?: 'PointsLeaderboardAccount', address: string, ens: string, avatarURL: string, earnings: { __typename?: 'PointsLeaderboardEarnings', total: number } }> | null }, user: { __typename?: 'PointsUser', referralCode: string, earnings_by_type: Array<{ __typename?: 'PointsUserEarningByType', type: string, earnings: { __typename?: 'PointsEarnings', total: number } } | null>, earnings: { __typename?: 'PointsEarnings', total: number }, rewards: { __typename?: 'PointsRewards', total: string, claimable: string, claimed: string }, stats: { __typename?: 'PointsStats', position: { __typename?: 'PointsStatsPosition', unranked: boolean, current: number }, referral: { __typename?: 'PointsStatsReferral', total_referees: number, qualified_referees: number }, last_airdrop: { __typename?: 'PointsStatsPositionLastAirdrop', position: { __typename?: 'PointsStatsPosition', unranked: boolean, current: number }, earnings: { __typename?: 'PointsEarnings', total: number }, differences: Array<{ __typename?: 'PointsStatsPositionLastAirdropDifference', type: string, group_id: string, earnings: { __typename?: 'PointsEarnings', total: number } } | null> }, last_period: { __typename?: 'PointsStatsPositionLastPeriod', position: { __typename?: 'PointsStatsPosition', unranked: boolean, current: number }, earnings: { __typename?: 'PointsEarnings', total: number } } } } } | null };

export type ClaimUserRewardsMutationVariables = Exact<{
  address: Scalars['String'];
}>;


export type ClaimUserRewardsMutation = { __typename?: 'Mutation', claimUserRewards?: { __typename?: 'UserClaimTransaction', chainID: number, uoHash: string, txHash: string, error?: { __typename?: 'PointsError', type: PointsErrorType, message: string } | null } | null };

export type TokenAllTimeFragmentFragment = { __typename?: 'TokenAllTime', highDate?: any | null, highValue?: number | null, lowDate?: any | null, lowValue?: number | null };

export type TokenColorsFragmentFragment = { __typename?: 'TokenColors', fallback?: string | null, primary: string, shadow?: string | null };

export type TokenLinkFragmentFragment = { __typename?: 'TokenLink', url: string };

export type TokenLinksFragmentFragment = { __typename?: 'TokenLinks', facebook?: { __typename?: 'TokenLink', url: string } | null, homepage?: { __typename?: 'TokenLink', url: string } | null, rainbow?: { __typename?: 'TokenLink', url: string } | null, other?: { __typename?: 'TokenLink', url: string } | null, farcaster?: { __typename?: 'TokenLink', url: string } | null, reddit?: { __typename?: 'TokenLink', url: string } | null, telegram?: { __typename?: 'TokenLink', url: string } | null, twitter?: { __typename?: 'TokenLink', url: string } | null };

export type TokenPriceChartFragmentFragment = { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null, timeEnd?: any | null, timeStart?: any | null };

export type TokenPriceChartsFragmentFragment = { __typename?: 'TokenPriceCharts', day?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null, timeEnd?: any | null, timeStart?: any | null } | null, hour?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null, timeEnd?: any | null, timeStart?: any | null } | null, max?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null, timeEnd?: any | null, timeStart?: any | null } | null, month?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null, timeEnd?: any | null, timeStart?: any | null } | null, week?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null, timeEnd?: any | null, timeStart?: any | null } | null, year?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null, timeEnd?: any | null, timeStart?: any | null } | null };

export type ExternalTokenQueryVariables = Exact<{
  address: Scalars['String'];
  chainId: Scalars['Int'];
  currency?: InputMaybe<Scalars['String']>;
}>;


export type ExternalTokenQuery = { __typename?: 'Query', token?: { __typename?: 'Token', decimals: number, iconUrl?: string | null, name: string, networks: any, transferable: boolean, symbol: string, colors: { __typename?: 'TokenColors', fallback?: string | null, primary: string, shadow?: string | null }, price: { __typename?: 'TokenPrice', relativeChange24h?: number | null, value?: number | null } } | null };

export type TokenMetadataQueryVariables = Exact<{
  address: Scalars['String'];
  chainId: Scalars['Int'];
  currency?: InputMaybe<Scalars['String']>;
}>;


export type TokenMetadataQuery = { __typename?: 'Query', token?: { __typename?: 'Token', circulatingSupply?: number | null, description?: string | null, fullyDilutedValuation?: number | null, iconUrl?: string | null, marketCap?: number | null, name: string, networks: any, rainbow: boolean, totalSupply?: number | null, volume1d?: number | null, colors: { __typename?: 'TokenColors', fallback?: string | null, primary: string, shadow?: string | null }, links?: { __typename?: 'TokenLinks', facebook?: { __typename?: 'TokenLink', url: string } | null, homepage?: { __typename?: 'TokenLink', url: string } | null, rainbow?: { __typename?: 'TokenLink', url: string } | null, other?: { __typename?: 'TokenLink', url: string } | null, farcaster?: { __typename?: 'TokenLink', url: string } | null, reddit?: { __typename?: 'TokenLink', url: string } | null, telegram?: { __typename?: 'TokenLink', url: string } | null, twitter?: { __typename?: 'TokenLink', url: string } | null } | null, price: { __typename?: 'TokenPrice', relativeChange24h?: number | null, value?: number | null }, rainbowTokenDetails?: { __typename?: 'RainbowTokenDetails', onchainData?: { __typename?: 'RainbowTokenOnchainData', creatorAddress?: string | null } | null } | null, launchpad?: { __typename?: 'LaunchpadResult', creatorAddress: string, isLaunchpadAvailable: boolean, launchpad?: { __typename?: 'Launchpad', name: string, protocol: string, protocolIconURL: string, socialInterface: string, socialInterfaceIconURL: string, platform: string, platformIconURL: string } | null } | null } | null };

export type PriceChartQueryVariables = Exact<{
  chainId: Scalars['Int'];
  address: Scalars['String'];
  currency?: InputMaybe<Scalars['String']>;
  day: Scalars['Boolean'];
  hour: Scalars['Boolean'];
  week: Scalars['Boolean'];
  month: Scalars['Boolean'];
  year: Scalars['Boolean'];
}>;


export type PriceChartQuery = { __typename?: 'Query', token?: { __typename?: 'Token', priceCharts: { __typename?: 'TokenPriceCharts', day?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null } | null, hour?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null } | null, week?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null } | null, month?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null } | null, year?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null } | null } } | null };

export type TrendingDAppsQueryVariables = Exact<{
  period?: InputMaybe<DAppRankingPeriod>;
}>;


export type TrendingDAppsQuery = { __typename?: 'Query', dApps?: Array<{ __typename?: 'DApp', name: string, shortName: string, description: string, url: string, iconURL: string, status: DAppStatus, trending?: boolean | null, colors: { __typename?: 'DAppColors', primary: string, fallback?: string | null, shadow?: string | null }, report: { __typename?: 'DAppReport', url: string } } | null> | null };

export type InteractionsWithTokenQueryVariables = Exact<{
  chainID: Scalars['Int'];
  address: Scalars['String'];
  tokenAddress: Scalars['String'];
  currency?: InputMaybe<Scalars['String']>;
}>;


export type InteractionsWithTokenQuery = { __typename?: 'Query', tokenInteractions?: Array<{ __typename?: 'TokenInteraction', interactedAt: number, chainID: number, direction: TokenInteractionDirection, type: TokenInteractionType, amount: string, price: number, transactionHash: string, explorerLabel: string, explorerURL: string } | null> | null };

export type MarketStatsQueryVariables = Exact<{
  chainID: Scalars['Int'];
  address: Scalars['String'];
}>;


export type MarketStatsQuery = { __typename?: 'Query', stats?: { __typename?: 'RainbowTokenStats', bucketCount: number, lastTransaction: any, liquidityPool: { __typename?: 'LiquidityPool', address: string, token0Address: string, token1Address: string }, summary: Array<{ __typename?: 'DurationSummary', duration: string, start: any, end: any, stats: { __typename?: 'Stats', transactions: number, buys: number, sells: number, volume: number, buyVolume: number, sellVolume: number, uniques: number, buyers: number, sellers: number, priceChangePct: number } } | null> } | null };

export type KingOfTheHillQueryVariables = Exact<{
  currency?: InputMaybe<Scalars['String']>;
}>;


export type KingOfTheHillQuery = { __typename?: 'Query', kingOfTheHill?: { __typename?: 'KingOfTheHill', current: { __typename?: 'KingOfTheHillToken', token: { __typename?: 'Token', chainId: number, address: string, decimals: number, name: string, symbol: string, iconUrl?: string | null, marketCap?: number | null, volume1d?: number | null, colors: { __typename?: 'TokenColors', primary: string, fallback?: string | null, shadow?: string | null }, marketData?: { __typename?: 'MarketData', marketCapFDV: string, volume24h: string, holders?: number | null } | null, price: { __typename?: 'TokenPrice', value?: number | null, relativeChange24h?: number | null }, rainbowTokenDetails?: { __typename?: 'RainbowTokenDetails', onchainData?: { __typename?: 'RainbowTokenOnchainData', creatorAddress?: string | null } | null } | null }, window: { __typename?: 'CompetitionWindow', start: number, end: number, durationSeconds: number, interval: string, secondsRemaining: number, isActive: boolean }, rankingDetails: { __typename?: 'RankingDetails', rankingCriteria: string, rankingCriteriaDesc: string, windowTradingVolume: string, lastUpdated: number } }, lastWinner?: { __typename?: 'KingOfTheHillToken', token: { __typename?: 'Token', chainId: number, address: string, decimals: number, name: string, symbol: string, iconUrl?: string | null, marketCap?: number | null, volume1d?: number | null, colors: { __typename?: 'TokenColors', primary: string, fallback?: string | null, shadow?: string | null }, marketData?: { __typename?: 'MarketData', marketCapFDV: string, volume24h: string, holders?: number | null } | null, price: { __typename?: 'TokenPrice', value?: number | null, relativeChange24h?: number | null } }, window: { __typename?: 'CompetitionWindow', start: number, end: number, durationSeconds: number, interval: string, secondsRemaining: number, isActive: boolean }, rankingDetails: { __typename?: 'RankingDetails', rankingCriteria: string, rankingCriteriaDesc: string, windowTradingVolume: string, lastUpdated: number } } | null } | null, kingOfTheHillLeaderBoard?: { __typename?: 'KingOfTheHillRankings', window: { __typename?: 'CompetitionWindow', start: number, end: number, durationSeconds: number, interval: string, secondsRemaining: number, isActive: boolean }, rankings: Array<{ __typename?: 'KingOfTheHillRankingElem', rank: number, windowTradingVolume: string, token: { __typename?: 'Token', chainId: number, address: string, decimals: number, name: string, symbol: string, iconUrl?: string | null, marketCap?: number | null, volume1d?: number | null, colors: { __typename?: 'TokenColors', primary: string, fallback?: string | null, shadow?: string | null }, price: { __typename?: 'TokenPrice', value?: number | null, relativeChange24h?: number | null } } }> } | null };

export const RewardsAmountFragmentDoc = gql`
    fragment rewardsAmount on RewardsAmount {
  usd
  token
}
    `;
export const BaseQueryFragmentDoc = gql`
    fragment baseQuery on Rewards {
  meta {
    title
    distribution {
      next
      total
      left
    }
    status
    end
    token {
      asset {
        assetCode
        decimals
        iconURL
        name
        chainID
        symbol
      }
    }
    color
  }
}
    `;
export const TransactionSimulationAssetFragmentDoc = gql`
    fragment transactionSimulationAsset on TransactionSimulationAsset {
  assetCode
  decimals
  iconURL
  name
  network
  symbol
  type
  interface
  tokenId
  status
}
    `;
export const ChangeFragmentDoc = gql`
    fragment change on TransactionSimulationChange {
  asset {
    ...transactionSimulationAsset
  }
  price
  quantity
}
    ${TransactionSimulationAssetFragmentDoc}`;
export const TargetFragmentDoc = gql`
    fragment target on TransactionSimulationTarget {
  address
  name
  iconURL
  function
  created
  sourceCodeStatus
}
    `;
export const SimulationErrorFragmentDoc = gql`
    fragment simulationError on TransactionError {
  message
  type
}
    `;
export const TokenAllTimeFragmentFragmentDoc = gql`
    fragment TokenAllTimeFragment on TokenAllTime {
  highDate
  highValue
  lowDate
  lowValue
}
    `;
export const TokenColorsFragmentFragmentDoc = gql`
    fragment TokenColorsFragment on TokenColors {
  fallback
  primary
  shadow
}
    `;
export const TokenLinkFragmentFragmentDoc = gql`
    fragment TokenLinkFragment on TokenLink {
  url
}
    `;
export const TokenLinksFragmentFragmentDoc = gql`
    fragment TokenLinksFragment on TokenLinks {
  facebook {
    ...TokenLinkFragment
  }
  homepage {
    ...TokenLinkFragment
  }
  rainbow {
    ...TokenLinkFragment
  }
  other {
    ...TokenLinkFragment
  }
  farcaster {
    ...TokenLinkFragment
  }
  reddit {
    ...TokenLinkFragment
  }
  telegram {
    ...TokenLinkFragment
  }
  twitter {
    ...TokenLinkFragment
  }
}
    ${TokenLinkFragmentFragmentDoc}`;
export const TokenPriceChartFragmentFragmentDoc = gql`
    fragment TokenPriceChartFragment on TokenPriceChart {
  points
  timeEnd
  timeStart
}
    `;
export const TokenPriceChartsFragmentFragmentDoc = gql`
    fragment TokenPriceChartsFragment on TokenPriceCharts {
  day {
    ...TokenPriceChartFragment
  }
  hour {
    ...TokenPriceChartFragment
  }
  max {
    ...TokenPriceChartFragment
  }
  month {
    ...TokenPriceChartFragment
  }
  week {
    ...TokenPriceChartFragment
  }
  year {
    ...TokenPriceChartFragment
  }
}
    ${TokenPriceChartFragmentFragmentDoc}`;
export const GetContractFunctionDocument = gql`
    query getContractFunction($chainID: Int!, $hex: String!) {
  contractFunction(chainID: $chainID, hex: $hex) {
    text
  }
}
    `;
export const GetEnsMarqueeDocument = gql`
    query getEnsMarquee {
  ensMarquee {
    accounts {
      name
      address
      avatar
    }
  }
}
    `;
export const GetRewardsDataForWalletDocument = gql`
    query getRewardsDataForWallet($address: String!) {
  rewards(project: OPTIMISM, address: $address) {
    ...baseQuery
    earnings {
      total {
        ...rewardsAmount
      }
      multiplier {
        amount
        breakdown {
          amount
          qualifier
        }
      }
      pending {
        ...rewardsAmount
      }
      daily {
        day
        usd
        token
      }
      updatedAt
    }
    stats {
      actions {
        type
        amount {
          ...rewardsAmount
        }
        rewardPercent
      }
    }
  }
}
    ${BaseQueryFragmentDoc}
${RewardsAmountFragmentDoc}`;
export const ReverseResolveEnsProfileDocument = gql`
    query reverseResolveENSProfile($chainID: Int!, $address: String!, $fields: [String!]) {
  reverseResolveENSProfile(chainID: $chainID, address: $address, fields: $fields) {
    name
    address
    resolverAddress
    reverseResolverAddress
    chainID
    fields {
      key
      value
    }
  }
}
    `;
export const GetdAppDocument = gql`
    query getdApp($shortName: String!, $url: String!, $status: Boolean!) {
  dApp(shortName: $shortName, url: $url) {
    name
    status @include(if: $status)
    colors {
      primary
      fallback
      shadow
    }
    iconURL
    url
    description
    shortName
  }
}
    `;
export const GetdAppsDocument = gql`
    query getdApps {
  dApps {
    name
    shortName
    description
    url
    iconURL
    colors {
      primary
      fallback
      shadow
    }
    status
    report {
      url
    }
    trending
  }
}
    `;
export const SimulateTransactionsDocument = gql`
    query simulateTransactions($chainId: Int!, $transactions: [Transaction!], $domain: String, $currency: String) {
  simulateTransactions(chainID: $chainId, transactions: $transactions, domain: $domain, currency: $currency) {
    error {
      ...simulationError
    }
    scanning {
      result
      description
    }
    gas {
      used
      estimate
    }
    report {
      url
    }
    simulation {
      in {
        ...change
      }
      out {
        ...change
      }
      approvals {
        asset {
          ...transactionSimulationAsset
        }
        spender {
          ...target
        }
        quantityAllowed
        quantityAtRisk
      }
      meta {
        transferTo {
          ...target
        }
        to {
          ...target
        }
      }
      delegation {
        address
        name
        iconURL
        created
        sourceCodeStatus
      }
    }
  }
}
    ${SimulationErrorFragmentDoc}
${ChangeFragmentDoc}
${TransactionSimulationAssetFragmentDoc}
${TargetFragmentDoc}`;
export const SimulateMessageDocument = gql`
    query simulateMessage($address: String!, $chainId: Int!, $message: Message!, $domain: String!) {
  simulateMessage(address: $address, chainID: $chainId, message: $message, domain: $domain) {
    error {
      ...simulationError
    }
    scanning {
      result
      description
    }
    simulation {
      in {
        ...change
      }
      out {
        ...change
      }
      approvals {
        asset {
          ...transactionSimulationAsset
        }
        spender {
          ...target
        }
        quantityAllowed
        quantityAtRisk
      }
      meta {
        to {
          ...target
        }
      }
    }
  }
}
    ${SimulationErrorFragmentDoc}
${ChangeFragmentDoc}
${TransactionSimulationAssetFragmentDoc}
${TargetFragmentDoc}`;
export const GetPointsDataForWalletDocument = gql`
    query getPointsDataForWallet($address: String!) {
  points(address: $address) {
    error {
      message
      type
    }
    meta {
      distribution {
        next
      }
      status
      rewards {
        total
      }
    }
    leaderboard {
      stats {
        total_users
        total_points
        rank_cutoff
      }
      accounts {
        address
        earnings {
          total
        }
        ens
        avatarURL
      }
    }
    user {
      referralCode
      earnings_by_type {
        type
        earnings {
          total
        }
      }
      earnings {
        total
      }
      rewards {
        total
        claimable
        claimed
      }
      stats {
        position {
          unranked
          current
        }
        referral {
          total_referees
          qualified_referees
        }
        last_airdrop {
          position {
            unranked
            current
          }
          earnings {
            total
          }
          differences {
            type
            group_id
            earnings {
              total
            }
          }
        }
        last_period {
          position {
            unranked
            current
          }
          earnings {
            total
          }
        }
      }
    }
  }
}
    `;
export const ClaimUserRewardsDocument = gql`
    mutation claimUserRewards($address: String!) {
  claimUserRewards(address: $address) {
    error {
      type
      message
    }
    chainID
    uoHash
    txHash
  }
}
    `;
export const ExternalTokenDocument = gql`
    query externalToken($address: String!, $chainId: Int!, $currency: String) {
  token(address: $address, chainID: $chainId, currency: $currency) {
    colors {
      ...TokenColorsFragment
    }
    decimals
    iconUrl
    name
    networks
    transferable
    price {
      relativeChange24h
      value
    }
    symbol
  }
}
    ${TokenColorsFragmentFragmentDoc}`;
export const TokenMetadataDocument = gql`
    query tokenMetadata($address: String!, $chainId: Int!, $currency: String) {
  token(address: $address, chainID: $chainId, currency: $currency) {
    circulatingSupply
    colors {
      ...TokenColorsFragment
    }
    description
    fullyDilutedValuation
    iconUrl
    links {
      ...TokenLinksFragment
    }
    marketCap
    name
    networks
    price {
      relativeChange24h
      value
    }
    rainbow
    rainbowTokenDetails {
      onchainData {
        creatorAddress
      }
    }
    launchpad {
      creatorAddress
      isLaunchpadAvailable
      launchpad {
        name
        protocol
        protocolIconURL
        socialInterface
        socialInterfaceIconURL
        platform
        platformIconURL
      }
    }
    totalSupply
    volume1d
  }
}
    ${TokenColorsFragmentFragmentDoc}
${TokenLinksFragmentFragmentDoc}`;
export const PriceChartDocument = gql`
    query priceChart($chainId: Int!, $address: String!, $currency: String, $day: Boolean!, $hour: Boolean!, $week: Boolean!, $month: Boolean!, $year: Boolean!) {
  token(chainID: $chainId, address: $address, currency: $currency) {
    priceCharts {
      day @include(if: $day) {
        points
      }
      hour @include(if: $hour) {
        points
      }
      week @include(if: $week) {
        points
      }
      month @include(if: $month) {
        points
      }
      year @include(if: $year) {
        points
      }
    }
  }
}
    `;
export const TrendingDAppsDocument = gql`
    query trendingDApps($period: DAppRankingPeriod) {
  dApps(trending: true, period: $period) {
    name
    shortName
    description
    url
    iconURL
    colors {
      primary
      fallback
      shadow
    }
    status
    report {
      url
    }
    trending
  }
}
    `;
export const InteractionsWithTokenDocument = gql`
    query interactionsWithToken($chainID: Int!, $address: String!, $tokenAddress: String!, $currency: String) {
  tokenInteractions(chainID: $chainID, address: $address, tokenAddress: $tokenAddress, currency: $currency) {
    interactedAt
    chainID
    direction
    type
    amount
    price
    transactionHash
    explorerLabel
    explorerURL
  }
}
    `;
export const MarketStatsDocument = gql`
    query marketStats($chainID: Int!, $address: String!) {
  stats(chainID: $chainID, address: $address) {
    bucketCount
    lastTransaction
    liquidityPool {
      address
      token0Address
      token1Address
    }
    summary {
      duration
      start
      end
      stats {
        transactions
        buys
        sells
        volume
        buyVolume
        sellVolume
        uniques
        buyers
        sellers
        priceChangePct
      }
    }
  }
}
    `;
export const KingOfTheHillDocument = gql`
    query kingOfTheHill($currency: String) {
  kingOfTheHill(currency: $currency) {
    current {
      token {
        chainId
        address
        decimals
        name
        symbol
        iconUrl
        colors {
          primary
          fallback
          shadow
        }
        marketData {
          marketCapFDV
          volume24h
          holders
        }
        marketCap
        volume1d
        price {
          value
          relativeChange24h
        }
        rainbowTokenDetails {
          onchainData {
            creatorAddress
          }
        }
      }
      window {
        start
        end
        durationSeconds
        interval
        secondsRemaining
        isActive
      }
      rankingDetails {
        rankingCriteria
        rankingCriteriaDesc
        windowTradingVolume
        lastUpdated
      }
    }
    lastWinner {
      token {
        chainId
        address
        decimals
        name
        symbol
        iconUrl
        colors {
          primary
          fallback
          shadow
        }
        marketData {
          marketCapFDV
          volume24h
          holders
        }
        marketCap
        volume1d
        price {
          value
          relativeChange24h
        }
      }
      window {
        start
        end
        durationSeconds
        interval
        secondsRemaining
        isActive
      }
      rankingDetails {
        rankingCriteria
        rankingCriteriaDesc
        windowTradingVolume
        lastUpdated
      }
    }
  }
  kingOfTheHillLeaderBoard(currency: $currency) {
    window {
      start
      end
      durationSeconds
      interval
      secondsRemaining
      isActive
    }
    rankings {
      rank
      windowTradingVolume
      token {
        chainId
        address
        decimals
        name
        symbol
        iconUrl
        colors {
          primary
          fallback
          shadow
        }
        marketCap
        volume1d
        price {
          value
          relativeChange24h
        }
      }
    }
  }
}
    `;
export type Requester<C = {}, E = unknown> = <R, V>(doc: DocumentNode, vars?: V, options?: C) => Promise<R> | AsyncIterable<R>
export function getSdk<C, E>(requester: Requester<C, E>) {
  return {
    getContractFunction(variables: GetContractFunctionQueryVariables, options?: C): Promise<GetContractFunctionQuery> {
      return requester<GetContractFunctionQuery, GetContractFunctionQueryVariables>(GetContractFunctionDocument, variables, options) as Promise<GetContractFunctionQuery>;
    },
    getEnsMarquee(variables?: GetEnsMarqueeQueryVariables, options?: C): Promise<GetEnsMarqueeQuery> {
      return requester<GetEnsMarqueeQuery, GetEnsMarqueeQueryVariables>(GetEnsMarqueeDocument, variables, options) as Promise<GetEnsMarqueeQuery>;
    },
    getRewardsDataForWallet(variables: GetRewardsDataForWalletQueryVariables, options?: C): Promise<GetRewardsDataForWalletQuery> {
      return requester<GetRewardsDataForWalletQuery, GetRewardsDataForWalletQueryVariables>(GetRewardsDataForWalletDocument, variables, options) as Promise<GetRewardsDataForWalletQuery>;
    },
    reverseResolveENSProfile(variables: ReverseResolveEnsProfileQueryVariables, options?: C): Promise<ReverseResolveEnsProfileQuery> {
      return requester<ReverseResolveEnsProfileQuery, ReverseResolveEnsProfileQueryVariables>(ReverseResolveEnsProfileDocument, variables, options) as Promise<ReverseResolveEnsProfileQuery>;
    },
    getdApp(variables: GetdAppQueryVariables, options?: C): Promise<GetdAppQuery> {
      return requester<GetdAppQuery, GetdAppQueryVariables>(GetdAppDocument, variables, options) as Promise<GetdAppQuery>;
    },
    getdApps(variables?: GetdAppsQueryVariables, options?: C): Promise<GetdAppsQuery> {
      return requester<GetdAppsQuery, GetdAppsQueryVariables>(GetdAppsDocument, variables, options) as Promise<GetdAppsQuery>;
    },
    simulateTransactions(variables: SimulateTransactionsQueryVariables, options?: C): Promise<SimulateTransactionsQuery> {
      return requester<SimulateTransactionsQuery, SimulateTransactionsQueryVariables>(SimulateTransactionsDocument, variables, options) as Promise<SimulateTransactionsQuery>;
    },
    simulateMessage(variables: SimulateMessageQueryVariables, options?: C): Promise<SimulateMessageQuery> {
      return requester<SimulateMessageQuery, SimulateMessageQueryVariables>(SimulateMessageDocument, variables, options) as Promise<SimulateMessageQuery>;
    },
    getPointsDataForWallet(variables: GetPointsDataForWalletQueryVariables, options?: C): Promise<GetPointsDataForWalletQuery> {
      return requester<GetPointsDataForWalletQuery, GetPointsDataForWalletQueryVariables>(GetPointsDataForWalletDocument, variables, options) as Promise<GetPointsDataForWalletQuery>;
    },
    claimUserRewards(variables: ClaimUserRewardsMutationVariables, options?: C): Promise<ClaimUserRewardsMutation> {
      return requester<ClaimUserRewardsMutation, ClaimUserRewardsMutationVariables>(ClaimUserRewardsDocument, variables, options) as Promise<ClaimUserRewardsMutation>;
    },
    externalToken(variables: ExternalTokenQueryVariables, options?: C): Promise<ExternalTokenQuery> {
      return requester<ExternalTokenQuery, ExternalTokenQueryVariables>(ExternalTokenDocument, variables, options) as Promise<ExternalTokenQuery>;
    },
    tokenMetadata(variables: TokenMetadataQueryVariables, options?: C): Promise<TokenMetadataQuery> {
      return requester<TokenMetadataQuery, TokenMetadataQueryVariables>(TokenMetadataDocument, variables, options) as Promise<TokenMetadataQuery>;
    },
    priceChart(variables: PriceChartQueryVariables, options?: C): Promise<PriceChartQuery> {
      return requester<PriceChartQuery, PriceChartQueryVariables>(PriceChartDocument, variables, options) as Promise<PriceChartQuery>;
    },
    trendingDApps(variables?: TrendingDAppsQueryVariables, options?: C): Promise<TrendingDAppsQuery> {
      return requester<TrendingDAppsQuery, TrendingDAppsQueryVariables>(TrendingDAppsDocument, variables, options) as Promise<TrendingDAppsQuery>;
    },
    interactionsWithToken(variables: InteractionsWithTokenQueryVariables, options?: C): Promise<InteractionsWithTokenQuery> {
      return requester<InteractionsWithTokenQuery, InteractionsWithTokenQueryVariables>(InteractionsWithTokenDocument, variables, options) as Promise<InteractionsWithTokenQuery>;
    },
    marketStats(variables: MarketStatsQueryVariables, options?: C): Promise<MarketStatsQuery> {
      return requester<MarketStatsQuery, MarketStatsQueryVariables>(MarketStatsDocument, variables, options) as Promise<MarketStatsQuery>;
    },
    kingOfTheHill(variables?: KingOfTheHillQueryVariables, options?: C): Promise<KingOfTheHillQuery> {
      return requester<KingOfTheHillQuery, KingOfTheHillQueryVariables>(KingOfTheHillDocument, variables, options) as Promise<KingOfTheHillQuery>;
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;