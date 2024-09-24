import { Address } from 'viem';
import { AddysAsset, AddysConsolidatedError, AddysResponseStatus } from '../types';
import { ChainId } from '@/chains/types';

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

type ClaimAction = ClaimActionTransaction | ClaimActionSponsored;

interface DApp {
  name: string;
  url: string;
  icon_url: string;
  colors: Colors;
}

interface AddysBaseClaimable {
  name: string;
  unique_id: string;
  type: string;
  network: ChainId;
  asset: AddysAsset;
  amount: string;
  dapp: DApp;
}

interface AddysTransactionClaimable extends AddysBaseClaimable {
  claim_action_type: 'transaction';
  claim_action: ClaimActionTransaction[];
}

interface AddysSponsoredClaimable extends AddysBaseClaimable {
  claim_action_type: 'sponsored';
  claim_action: ClaimActionSponsored[];
}

interface AddysUnsupportedClaimable extends AddysBaseClaimable {
  claim_action_type?: 'unknown' | null;
  claim_action?: ClaimAction[];
}

export type AddysClaimable = AddysTransactionClaimable | AddysSponsoredClaimable | AddysUnsupportedClaimable;

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

interface BaseClaimable {
  asset: {
    iconUrl: string;
    name: string;
    symbol: string;
  };
  chainId: ChainId;
  name: string;
  uniqueId: string;
  iconUrl: string;
  value: {
    claimAsset: { amount: string; display: string };
    nativeAsset: { amount: string; display: string };
  };
}

export interface TransactionClaimable extends BaseClaimable {
  type: 'transaction';
  action: { to: Address; data: string };
}

export interface SponsoredClaimable extends BaseClaimable {
  type: 'sponsored';
  action: { url: string; method: string };
}

export type Claimable = TransactionClaimable | SponsoredClaimable;

interface ClaimTransactionStatus {
  network: ChainId;
  transaction_hash: string;
  explorer_url: string;
  sponsored_status: string;
}

export interface ClaimResponse {
  success: boolean;
  claimable: Claimable | null;
  claim_transaction_status: ClaimTransactionStatus | null;
}
