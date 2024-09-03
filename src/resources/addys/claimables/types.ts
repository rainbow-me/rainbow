import { ChainId } from '@rainbow-me/swaps';
import { Address } from 'viem';
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

type ClaimAction = ClaimActionTransaction | ClaimActionSponsored;

interface DApp {
  name: string;
  url: string;
  icon_url: string;
  colors: Colors;
}

type ClaimableType = 'transaction' | 'sponsored';

export interface AddysClaimable {
  name: string;
  unique_id: string;
  type: ClaimableType;
  network: ChainId;
  asset: AddysAsset;
  amount: string;
  dapp: DApp;
  claim_action_type?: string | null;
  claim_action?: ClaimAction[];
}

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

// will add more attributes as needed
export interface Claimable {
  name: string;
  uniqueId: string;
  iconUrl: string;
  value: {
    claimAsset: { amount: string; display: string };
    nativeAsset: { amount: string; display: string };
  };
}
