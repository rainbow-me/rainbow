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

export enum Device {
  App = 'APP',
  Bx = 'BX'
}

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
  defaultExplorer: NetworkExplorer;
  defaultRPC: NetworkRpc;
  enabledServices: NetworkEnabledServices;
  icons: NetworkIcons;
  id: Scalars['ID'];
  label: Scalars['String'];
  name: Scalars['String'];
  nativeAsset: NetworkAsset;
  nativeWrappedAsset: NetworkAsset;
  opStack: Scalars['Boolean'];
  testnet: Scalars['Boolean'];
};

export type NetworkAddys = {
  __typename?: 'NetworkAddys';
  approvals: Scalars['Boolean'];
  assets: Scalars['Boolean'];
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

export type NetworkEnabledServices = {
  __typename?: 'NetworkEnabledServices';
  addys: NetworkAddys;
  meteorology: NetworkMeteorology;
  nftProxy: NetworkNftProxy;
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

export type NetworkIcons = {
  __typename?: 'NetworkIcons';
  badgeURL: Scalars['String'];
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

export type NetworkRpc = {
  __typename?: 'NetworkRPC';
  enabledDevices: Array<Maybe<Device>>;
  url: Scalars['String'];
};

export type NetworkSwap = {
  __typename?: 'NetworkSwap';
  bridge: Scalars['Boolean'];
  enabled: Scalars['Boolean'];
  swap: Scalars['Boolean'];
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
  dApp?: Maybe<DApp>;
  dApps?: Maybe<Array<Maybe<DApp>>>;
  ensMarquee?: Maybe<EnsMarquee>;
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
  token?: Maybe<Token>;
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


export type QueryDAppArgs = {
  shortName?: InputMaybe<Scalars['String']>;
  url?: InputMaybe<Scalars['String']>;
};


export type QueryDAppsArgs = {
  period?: InputMaybe<DAppRankingPeriod>;
  trending?: InputMaybe<Scalars['Boolean']>;
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


export type QueryTokenArgs = {
  address: Scalars['String'];
  chainID: Scalars['Int'];
  currency?: InputMaybe<Scalars['String']>;
};


export type QueryValidateReferralArgs = {
  referral: Scalars['String'];
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

export type Token = {
  __typename?: 'Token';
  allTime: TokenAllTime;
  bridging: Scalars['TokenBridging'];
  circulatingSupply?: Maybe<Scalars['Float']>;
  colors: TokenColors;
  decimals: Scalars['Int'];
  description?: Maybe<Scalars['String']>;
  fullyDilutedValuation?: Maybe<Scalars['Float']>;
  iconUrl?: Maybe<Scalars['String']>;
  links?: Maybe<TokenLinks>;
  marketCap?: Maybe<Scalars['Float']>;
  name: Scalars['String'];
  networks: Scalars['TokenNetworks'];
  price: TokenPrice;
  priceCharts: TokenPriceCharts;
  symbol: Scalars['String'];
  totalSupply?: Maybe<Scalars['Float']>;
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

export type TokenLink = {
  __typename?: 'TokenLink';
  url: Scalars['String'];
};

export type TokenLinks = {
  __typename?: 'TokenLinks';
  facebook?: Maybe<TokenLink>;
  homepage?: Maybe<TokenLink>;
  reddit?: Maybe<TokenLink>;
  telegram?: Maybe<TokenLink>;
  twitter?: Maybe<TokenLink>;
};

export type TokenPrice = {
  __typename?: 'TokenPrice';
  relativeChange24h?: Maybe<Scalars['Float']>;
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

export type Transaction = {
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

export type TransactionSimulationMeta = {
  __typename?: 'TransactionSimulationMeta';
  to?: Maybe<TransactionSimulationTarget>;
  transferTo?: Maybe<TransactionSimulationTarget>;
};

export type TransactionSimulationResult = {
  __typename?: 'TransactionSimulationResult';
  approvals?: Maybe<Array<Maybe<TransactionSimulationApproval>>>;
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

export type AmountFragment = { __typename?: 'RewardsAmount', usd: number, token: number };

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

export type AssetFragment = { __typename?: 'TransactionSimulationAsset', assetCode: string, decimals: number, iconURL: string, name: string, network: string, symbol: string, type: TransactionAssetType, interface: TransactionAssetInterface, tokenId: string, status: VerificationStatus };

export type ChangeFragment = { __typename?: 'TransactionSimulationChange', price: number, quantity: string, asset: { __typename?: 'TransactionSimulationAsset', assetCode: string, decimals: number, iconURL: string, name: string, network: string, symbol: string, type: TransactionAssetType, interface: TransactionAssetInterface, tokenId: string, status: VerificationStatus } };

export type TargetFragment = { __typename?: 'TransactionSimulationTarget', address: string, name: string, iconURL: string, function: string, created?: any | null, sourceCodeStatus?: VerificationStatus | null };

export type SimulationErrorFragment = { __typename?: 'TransactionError', message: string, type: TransactionErrorType };

export type SimulateTransactionsQueryVariables = Exact<{
  chainId: Scalars['Int'];
  transactions?: InputMaybe<Array<Transaction> | Transaction>;
  domain?: InputMaybe<Scalars['String']>;
  currency?: InputMaybe<Scalars['String']>;
}>;


export type SimulateTransactionsQuery = { __typename?: 'Query', simulateTransactions?: Array<{ __typename?: 'TransactionResult', error?: { __typename?: 'TransactionError', message: string, type: TransactionErrorType } | null, scanning?: { __typename?: 'TransactionScanningResult', result: TransactionScanResultType, description: string } | null, gas?: { __typename?: 'TransactionGasResult', used: string, estimate: string } | null, report?: { __typename?: 'TransactionReport', url: string } | null, simulation?: { __typename?: 'TransactionSimulationResult', in?: Array<{ __typename?: 'TransactionSimulationChange', price: number, quantity: string, asset: { __typename?: 'TransactionSimulationAsset', assetCode: string, decimals: number, iconURL: string, name: string, network: string, symbol: string, type: TransactionAssetType, interface: TransactionAssetInterface, tokenId: string, status: VerificationStatus } } | null> | null, out?: Array<{ __typename?: 'TransactionSimulationChange', price: number, quantity: string, asset: { __typename?: 'TransactionSimulationAsset', assetCode: string, decimals: number, iconURL: string, name: string, network: string, symbol: string, type: TransactionAssetType, interface: TransactionAssetInterface, tokenId: string, status: VerificationStatus } } | null> | null, approvals?: Array<{ __typename?: 'TransactionSimulationApproval', quantityAllowed: string, quantityAtRisk: string, asset: { __typename?: 'TransactionSimulationAsset', assetCode: string, decimals: number, iconURL: string, name: string, network: string, symbol: string, type: TransactionAssetType, interface: TransactionAssetInterface, tokenId: string, status: VerificationStatus }, spender: { __typename?: 'TransactionSimulationTarget', address: string, name: string, iconURL: string, function: string, created?: any | null, sourceCodeStatus?: VerificationStatus | null } } | null> | null, meta?: { __typename?: 'TransactionSimulationMeta', transferTo?: { __typename?: 'TransactionSimulationTarget', address: string, name: string, iconURL: string, function: string, created?: any | null, sourceCodeStatus?: VerificationStatus | null } | null, to?: { __typename?: 'TransactionSimulationTarget', address: string, name: string, iconURL: string, function: string, created?: any | null, sourceCodeStatus?: VerificationStatus | null } | null } | null } | null } | null> | null };

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


export type GetPointsDataForWalletQuery = { __typename?: 'Query', points?: { __typename?: 'Points', error?: { __typename?: 'PointsError', message: string, type: PointsErrorType } | null, meta: { __typename?: 'PointsMeta', status: PointsMetaStatus, distribution: { __typename?: 'PointsMetaDistribution', next: number } }, leaderboard: { __typename?: 'PointsLeaderboard', stats: { __typename?: 'PointsLeaderboardStats', total_users: number, total_points: number, rank_cutoff: number }, accounts?: Array<{ __typename?: 'PointsLeaderboardAccount', address: string, ens: string, avatarURL: string, earnings: { __typename?: 'PointsLeaderboardEarnings', total: number } }> | null }, user: { __typename?: 'PointsUser', referralCode: string, earnings_by_type: Array<{ __typename?: 'PointsUserEarningByType', type: string, earnings: { __typename?: 'PointsEarnings', total: number } } | null>, earnings: { __typename?: 'PointsEarnings', total: number }, stats: { __typename?: 'PointsStats', position: { __typename?: 'PointsStatsPosition', unranked: boolean, current: number }, referral: { __typename?: 'PointsStatsReferral', total_referees: number, qualified_referees: number }, last_airdrop: { __typename?: 'PointsStatsPositionLastAirdrop', position: { __typename?: 'PointsStatsPosition', unranked: boolean, current: number }, earnings: { __typename?: 'PointsEarnings', total: number }, differences: Array<{ __typename?: 'PointsStatsPositionLastAirdropDifference', type: string, group_id: string, earnings: { __typename?: 'PointsEarnings', total: number } } | null> } } } } | null };

export type GetPointsOnboardChallengeQueryVariables = Exact<{
  address: Scalars['String'];
  referral?: InputMaybe<Scalars['String']>;
}>;


export type GetPointsOnboardChallengeQuery = { __typename?: 'Query', pointsOnboardChallenge: string };

export type OnboardPointsMutationVariables = Exact<{
  address: Scalars['String'];
  signature: Scalars['String'];
  referral?: InputMaybe<Scalars['String']>;
}>;


export type OnboardPointsMutation = { __typename?: 'Mutation', onboardPoints?: { __typename?: 'Points', error?: { __typename?: 'PointsError', message: string, type: PointsErrorType } | null, meta: { __typename?: 'PointsMeta', status: PointsMetaStatus, distribution: { __typename?: 'PointsMetaDistribution', next: number } }, leaderboard: { __typename?: 'PointsLeaderboard', stats: { __typename?: 'PointsLeaderboardStats', total_users: number, total_points: number, rank_cutoff: number }, accounts?: Array<{ __typename?: 'PointsLeaderboardAccount', address: string, ens: string, avatarURL: string, earnings: { __typename?: 'PointsLeaderboardEarnings', total: number } }> | null }, user: { __typename?: 'PointsUser', referralCode: string, earnings_by_type: Array<{ __typename?: 'PointsUserEarningByType', type: string, earnings: { __typename?: 'PointsEarnings', total: number } } | null>, earnings: { __typename?: 'PointsEarnings', total: number }, onboarding: { __typename?: 'PointsOnboarding', earnings: { __typename?: 'PointsOnboardingEarnings', total: number }, categories?: Array<{ __typename?: 'PointsOnboardingCategory', type: string, display_type: PointsOnboardDisplayType, data: { __typename?: 'PointsOnboardingCategoryData', usd_amount: number, total_collections: number, owned_collections: number }, earnings: { __typename?: 'PointsOnboardingEarnings', total: number } }> | null }, stats: { __typename?: 'PointsStats', position: { __typename?: 'PointsStatsPosition', unranked: boolean, current: number }, referral: { __typename?: 'PointsStatsReferral', total_referees: number, qualified_referees: number }, last_airdrop: { __typename?: 'PointsStatsPositionLastAirdrop', position: { __typename?: 'PointsStatsPosition', unranked: boolean, current: number }, earnings: { __typename?: 'PointsEarnings', total: number }, differences: Array<{ __typename?: 'PointsStatsPositionLastAirdropDifference', type: string, group_id: string, earnings: { __typename?: 'PointsEarnings', total: number } } | null> } } } } | null };

export type ValidateReferralQueryVariables = Exact<{
  code: Scalars['String'];
}>;


export type ValidateReferralQuery = { __typename?: 'Query', validateReferral?: { __typename?: 'ValidatedReferral', valid: boolean, error?: { __typename?: 'PointsError', type: PointsErrorType, message: string } | null } | null };

export type RedeemCodeForPointsMutationVariables = Exact<{
  address: Scalars['String'];
  redemptionCode: Scalars['String'];
}>;


export type RedeemCodeForPointsMutation = { __typename?: 'Mutation', redeemCode?: { __typename?: 'RedeemedPoints', earnings: { __typename?: 'RedeemedPointsEarnings', total: number }, redemption_code: { __typename?: 'RedemptionCode', code: string }, error?: { __typename?: 'PointsError', type: PointsErrorType, message: string } | null } | null };

export type TokenAllTimeFragmentFragment = { __typename?: 'TokenAllTime', highDate?: any | null, highValue?: number | null, lowDate?: any | null, lowValue?: number | null };

export type TokenColorsFragmentFragment = { __typename?: 'TokenColors', fallback?: string | null, primary: string, shadow?: string | null };

export type TokenLinkFragmentFragment = { __typename?: 'TokenLink', url: string };

export type TokenLinksFragmentFragment = { __typename?: 'TokenLinks', facebook?: { __typename?: 'TokenLink', url: string } | null, homepage?: { __typename?: 'TokenLink', url: string } | null, reddit?: { __typename?: 'TokenLink', url: string } | null, telegram?: { __typename?: 'TokenLink', url: string } | null, twitter?: { __typename?: 'TokenLink', url: string } | null };

export type TokenPriceChartFragmentFragment = { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null, timeEnd?: any | null, timeStart?: any | null };

export type TokenPriceChartsFragmentFragment = { __typename?: 'TokenPriceCharts', day?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null, timeEnd?: any | null, timeStart?: any | null } | null, hour?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null, timeEnd?: any | null, timeStart?: any | null } | null, max?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null, timeEnd?: any | null, timeStart?: any | null } | null, month?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null, timeEnd?: any | null, timeStart?: any | null } | null, week?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null, timeEnd?: any | null, timeStart?: any | null } | null, year?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null, timeEnd?: any | null, timeStart?: any | null } | null };

export type ExternalTokenQueryVariables = Exact<{
  address: Scalars['String'];
  chainId: Scalars['Int'];
  currency?: InputMaybe<Scalars['String']>;
}>;


export type ExternalTokenQuery = { __typename?: 'Query', token?: { __typename?: 'Token', decimals: number, iconUrl?: string | null, name: string, networks: any, symbol: string, colors: { __typename?: 'TokenColors', fallback?: string | null, primary: string, shadow?: string | null }, price: { __typename?: 'TokenPrice', relativeChange24h?: number | null, value?: number | null } } | null };

export type TokenMetadataQueryVariables = Exact<{
  address: Scalars['String'];
  chainId: Scalars['Int'];
  currency?: InputMaybe<Scalars['String']>;
}>;


export type TokenMetadataQuery = { __typename?: 'Query', token?: { __typename?: 'Token', circulatingSupply?: number | null, description?: string | null, fullyDilutedValuation?: number | null, iconUrl?: string | null, marketCap?: number | null, name: string, networks: any, totalSupply?: number | null, volume1d?: number | null, colors: { __typename?: 'TokenColors', fallback?: string | null, primary: string, shadow?: string | null }, links?: { __typename?: 'TokenLinks', facebook?: { __typename?: 'TokenLink', url: string } | null, homepage?: { __typename?: 'TokenLink', url: string } | null, reddit?: { __typename?: 'TokenLink', url: string } | null, telegram?: { __typename?: 'TokenLink', url: string } | null, twitter?: { __typename?: 'TokenLink', url: string } | null } | null, price: { __typename?: 'TokenPrice', relativeChange24h?: number | null, value?: number | null } } | null };

export type PriceChartQueryVariables = Exact<{
  chainId: Scalars['Int'];
  address: Scalars['String'];
  day: Scalars['Boolean'];
  hour: Scalars['Boolean'];
  week: Scalars['Boolean'];
  month: Scalars['Boolean'];
  year: Scalars['Boolean'];
}>;


export type PriceChartQuery = { __typename?: 'Query', token?: { __typename?: 'Token', priceCharts: { __typename?: 'TokenPriceCharts', day?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null } | null, hour?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null } | null, week?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null } | null, month?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null } | null, year?: { __typename?: 'TokenPriceChart', points?: Array<Array<any | null> | null> | null } | null } } | null };

export const AmountFragmentDoc = gql`
    fragment amount on RewardsAmount {
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
export const AssetFragmentDoc = gql`
    fragment asset on TransactionSimulationAsset {
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
    ...asset
  }
  price
  quantity
}
    ${AssetFragmentDoc}`;
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
        ...amount
      }
      multiplier {
        amount
        breakdown {
          amount
          qualifier
        }
      }
      pending {
        ...amount
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
          ...amount
        }
        rewardPercent
      }
    }
  }
}
    ${BaseQueryFragmentDoc}
${AmountFragmentDoc}`;
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
          ...asset
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
    }
  }
}
    ${SimulationErrorFragmentDoc}
${ChangeFragmentDoc}
${AssetFragmentDoc}
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
          ...asset
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
${AssetFragmentDoc}
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
      }
    }
  }
}
    `;
export const GetPointsOnboardChallengeDocument = gql`
    query getPointsOnboardChallenge($address: String!, $referral: String) {
  pointsOnboardChallenge(address: $address, referral: $referral)
}
    `;
export const OnboardPointsDocument = gql`
    mutation onboardPoints($address: String!, $signature: String!, $referral: String) {
  onboardPoints(address: $address, signature: $signature, referral: $referral) {
    error {
      message
      type
    }
    meta {
      distribution {
        next
      }
      status
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
      onboarding {
        earnings {
          total
        }
        categories {
          data {
            usd_amount
            total_collections
            owned_collections
          }
          type
          display_type
          earnings {
            total
          }
        }
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
      }
    }
  }
}
    `;
export const ValidateReferralDocument = gql`
    query validateReferral($code: String!) {
  validateReferral(referral: $code) {
    valid
    error {
      type
      message
    }
  }
}
    `;
export const RedeemCodeForPointsDocument = gql`
    mutation redeemCodeForPoints($address: String!, $redemptionCode: String!) {
  redeemCode(address: $address, code: $redemptionCode) {
    earnings {
      total
    }
    redemption_code {
      code
    }
    error {
      type
      message
    }
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
    totalSupply
    volume1d
  }
}
    ${TokenColorsFragmentFragmentDoc}
${TokenLinksFragmentFragmentDoc}`;
export const PriceChartDocument = gql`
    query priceChart($chainId: Int!, $address: String!, $day: Boolean!, $hour: Boolean!, $week: Boolean!, $month: Boolean!, $year: Boolean!) {
  token(chainID: $chainId, address: $address) {
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
    getPointsOnboardChallenge(variables: GetPointsOnboardChallengeQueryVariables, options?: C): Promise<GetPointsOnboardChallengeQuery> {
      return requester<GetPointsOnboardChallengeQuery, GetPointsOnboardChallengeQueryVariables>(GetPointsOnboardChallengeDocument, variables, options) as Promise<GetPointsOnboardChallengeQuery>;
    },
    onboardPoints(variables: OnboardPointsMutationVariables, options?: C): Promise<OnboardPointsMutation> {
      return requester<OnboardPointsMutation, OnboardPointsMutationVariables>(OnboardPointsDocument, variables, options) as Promise<OnboardPointsMutation>;
    },
    validateReferral(variables: ValidateReferralQueryVariables, options?: C): Promise<ValidateReferralQuery> {
      return requester<ValidateReferralQuery, ValidateReferralQueryVariables>(ValidateReferralDocument, variables, options) as Promise<ValidateReferralQuery>;
    },
    redeemCodeForPoints(variables: RedeemCodeForPointsMutationVariables, options?: C): Promise<RedeemCodeForPointsMutation> {
      return requester<RedeemCodeForPointsMutation, RedeemCodeForPointsMutationVariables>(RedeemCodeForPointsDocument, variables, options) as Promise<RedeemCodeForPointsMutation>;
    },
    externalToken(variables: ExternalTokenQueryVariables, options?: C): Promise<ExternalTokenQuery> {
      return requester<ExternalTokenQuery, ExternalTokenQueryVariables>(ExternalTokenDocument, variables, options) as Promise<ExternalTokenQuery>;
    },
    tokenMetadata(variables: TokenMetadataQueryVariables, options?: C): Promise<TokenMetadataQuery> {
      return requester<TokenMetadataQuery, TokenMetadataQueryVariables>(TokenMetadataDocument, variables, options) as Promise<TokenMetadataQuery>;
    },
    priceChart(variables: PriceChartQueryVariables, options?: C): Promise<PriceChartQuery> {
      return requester<PriceChartQuery, PriceChartQueryVariables>(PriceChartDocument, variables, options) as Promise<PriceChartQuery>;
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;