import { ChainId } from '@rainbow-me/swaps';
import { Address } from 'viem';

interface BridgeableNetwork {
  bridgeable: boolean;
}

interface TokenBridging {
  bridgeable: boolean;
  networks: Record<ChainId, BridgeableNetwork>;
}

interface TokenMapping {
  address: Address;
  decimals: number;
}

interface Colors {
  primary: string;
  fallback: string;
  shadow: string;
}

interface Price {
  value: number;
  changed_at: number;
  relative_change_24h: number;
}

interface ClaimAction {
  address_to: Address;
  calldata: string;
  chain_id: ChainId;
}

interface DApp {
  name: string;
  url: string;
  icon_url: string;
  colors: Colors;
}

interface Asset {
  asset_code: string;
  decimals: number;
  icon_url: string;
  name: string;
  network?: string;
  chain_id?: ChainId;
  price: Price;
  symbol: string;
  type?: string;
  interface?: string;
  colors?: Colors;
  networks?: Record<ChainId, TokenMapping>;
  // Adding as pointer to avoid showing on NFTs
  bridging?: TokenBridging | null;
  // To avoid zerion from filtering assets themselves, we add this internal flag to verify them ourselves
  probable_spam: boolean;
  // New field to handle ERC-721 and ERC-1155 token ids
  token_id?: string;
  // For ERC-20 tokens, we show the verified status
  verified?: boolean;
  // Mark defi position based on token type
  defi_position?: boolean;
  // Transferable Making it a pointer so NFTs doesn't show this field
  transferable?: boolean | null;
  creation_date?: Date | null;
}

export interface Claimable {
  name: string;
  type: string;
  network: ChainId;
  asset: Asset;
  amout: string;
  dapp: DApp;
  claim_action_type?: string | null;
  claim_action?: ClaimAction[];
}

interface ConsolidatedClaimablesPayloadResponse {
  claimables: Claimable[];
}

type Status = 'ok' | 'still_indexing' | 'not_found' | 'pending' | 'error';

interface ConsolidatedChainIDError {
  chain_id: ChainId;
  error: string;
}

interface ConsolidatedError {
  address: Address;
  errors: ConsolidatedChainIDError[];
}

interface ConsolidatedClaimablesMetadataResponse {
  addresses: Address[];
  currency: string;
  chain_ids: ChainId[];
  errors: ConsolidatedError[];
  addresses_with_errors: Address[];
  chain_ids_with_errors: ChainId[];
  status: Status;
}

export interface ConsolidatedClaimablesResponse {
  metadata: ConsolidatedClaimablesMetadataResponse;
  payload: ConsolidatedClaimablesPayloadResponse;
}
