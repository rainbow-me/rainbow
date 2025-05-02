import { Address } from 'viem';
import { ParsedAddressAsset } from '@/entities';
import { ChainId } from '@/state/backendNetworks/types';
import { AddysAsset, AddysConsolidatedError, AddysResponseStatus } from '../types';

interface Colors {
  primary: string;
  fallback: string;
  shadow: string;
}

interface ClaimActionSponsored {
  url: string;
  method: string;
}

interface ClaimActionTransaction {
  address_to: Address;
  calldata: string;
  chain_id: ChainId;
}

export const acceptedClaimableTypes = ['transaction', 'sponsored', 'multi_transaction'] as const;
export type AcceptedClaimableType = (typeof acceptedClaimableTypes)[number];

type ClaimAction = ClaimActionTransaction | ClaimActionSponsored;

interface DApp {
  name: string;
  url: string;
  icon_url: string;
  colors: Colors;
}

export enum ClaimableType {
  MoxieDaily = 'moxie-daily',
  MoxieVested = 'moxie-vested',
  ZoraRewards = 'zora-rewards',
  DegenAirdrop = 'degen-airdrop',
  merklClaimable = 'merkl-claimable',
  MorphoClaimable = 'morpho-claimable',
  Blur = 'blur',
  Aerodrome = 'aerodrome-finance',
  Velodrome = 'velodrome-finance',
  HypersubV1 = 'hypersub-v1',
  HypersubV2 = 'hypersub-v2',
  Clanker = 'clanker',
  Rainbow = 'rainbow',
  RainbowEthRewards = 'rainbow-eth-rewards',
  RainbowSuperTokenCreatorFees = 'rainbow-super-token-creator-fees',

  // test claims
  Testing = 'frontend-testing',
  TestingSponsored = 'frontend-testing-sponsored',
}

export interface ClaimableAsset<T, A> {
  asset: T;
  amount: A;
  usd_value: number;
  value: string;
}

export type FormattedAmount = {
  amount: string;
  display: string;
};

interface AddysBaseClaimable {
  name: string;
  unique_id: string;
  type: ClaimableType;
  network: ChainId;
  dapp: DApp;
  assets: ClaimableAsset<AddysAsset, string>[];
  total_usd_value: number;
  total_value: string;

  /**
   * @deprecated - use assets instead
   */
  asset: AddysAsset;

  /**
   * @deprecated - use assets[number].amount instead
   */
  amount: string;
}

interface AddysTransactionClaimable extends AddysBaseClaimable {
  claim_action_type: 'transaction';
  claim_action: ClaimActionTransaction[];
}

interface AddysRainbowClaimable extends AddysTransactionClaimable {
  creator_address: Address;
}

interface AddysSponsoredClaimable extends AddysBaseClaimable {
  claim_action_type: 'sponsored';
  claim_action: ClaimActionSponsored[];
}

interface AddysMultiTransactionClaimable extends AddysBaseClaimable {
  claim_action_type: 'multi_transaction';
  claim_action: ClaimActionTransaction[];
}

interface AddysUnsupportedClaimable extends AddysBaseClaimable {
  claim_action_type?: 'unknown' | null;
  claim_action?: ClaimAction[];
}

export type AddysClaimable =
  | AddysTransactionClaimable
  | AddysRainbowClaimable
  | AddysSponsoredClaimable
  | AddysMultiTransactionClaimable
  | AddysUnsupportedClaimable;

interface ConsolidatedClaimablesPayloadResponse {
  claimables: AddysClaimable[];
}

interface ConsolidatedClaimablesMetadataResponse {
  addresses: Address[];
  currency: string;
  chain_ids: ChainId[];
  errors: AddysConsolidatedError[];
  addresses_with_errors: Address[];
  chain_ids_with_errors: ChainId[];
  status: AddysResponseStatus;
}

export interface ConsolidatedClaimablesResponse {
  metadata: ConsolidatedClaimablesMetadataResponse;
  payload: ConsolidatedClaimablesPayloadResponse;
}

export interface BaseClaimable {
  assets: ClaimableAsset<ParsedAddressAsset, FormattedAmount>[];
  /**
   * @deprecated - use assets[number].asset instead
   */
  asset: ParsedAddressAsset;
  chainId: ChainId;
  name: string;
  uniqueId: string;
  iconUrl: string;
  type: ClaimableType;
  totalCurrencyValue: {
    amount: string;
    display: string;
  };
}

export interface TransactionClaimable extends BaseClaimable {
  actionType: 'transaction' | 'multi_transaction';
  action: { to: Address; data: string }[];
}

export interface RainbowClaimable extends TransactionClaimable {
  creatorAddress: Address;
}

export interface SponsoredClaimable extends BaseClaimable {
  actionType: 'sponsored';
  action: { url: string; method: string };
}

export type Claimable = TransactionClaimable | RainbowClaimable | SponsoredClaimable;

interface ClaimTransactionStatus {
  network: ChainId;
  transaction_hash: string;
  explorer_url: string;
  sponsored_status: string;
}

interface ClaimPayloadResponse {
  success: boolean;
  claimable: Claimable | null;
  claim_transaction_status: ClaimTransactionStatus | null;
}

interface ClaimMetadataResponse {
  address: string;
  chain_id: ChainId;
  currency: string;
  claim_type: string;
  error: string;
}

export interface ClaimResponse {
  metadata: ClaimMetadataResponse;
  payload: ClaimPayloadResponse;
}
