import { NativeCurrencyKey } from '@/entities';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { QueryConfigWithSelect, QueryFunctionArgs, QueryFunctionResult, createQueryKey } from '@/react-query';
import { SUPPORTED_CHAIN_IDS } from '@/references';
import { ChainId } from '@rainbow-me/swaps';
import { useQuery } from '@tanstack/react-query';
import { ADDYS_API_KEY } from 'react-native-dotenv';
import { Address } from 'viem';

const addysHttp = new RainbowFetchClient({
  baseURL: 'https://addys.p.rainbow.me/v3',
  headers: {
    Authorization: `Bearer ${ADDYS_API_KEY}`,
  },
});

interface BridgeableNetwork {
  bridgeable: boolean;
}

interface TokenBridging {
  bridgeable: boolean;
  networks: Record<ChainId, BridgeableNetwork>;
}

interface TokenMapping {
  address: string;
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
  address_to: string;
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

interface Claimable {
  name: string;
  type: string;
  network: ChainId;
  asset: Asset;
  amout: string;
  dapp: DApp;
  claim_action_type?: string | null;
  claim_action?: ClaimAction[];
}

interface Claimables {
  metadata: {
    addresses: Address[];
    currency: string;
    chain_ids: ChainId[];
    errors: [];
    addresses_with_errors: [];
    chain_ids_with_errors: [];
    status: string;
  };
  payload: {
    claimables: Claimable[];
  };
}

// ///////////////////////////////////////////////
// Query Types

export type ClaimablesArgs = {
  address: Address;
  currency: NativeCurrencyKey;
  testnetMode?: boolean;
};

// ///////////////////////////////////////////////
// Query Key

export const claimablesQueryKey = ({ address, currency, testnetMode }: ClaimablesArgs) =>
  createQueryKey('claimables', { address, currency, testnetMode }, { persisterVersion: 1 });

type ClaimablesQueryKey = ReturnType<typeof claimablesQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function claimablesQueryFunction({ queryKey: [{ address, currency, testnetMode }] }: QueryFunctionArgs<typeof claimablesQueryKey>) {
  const url = `/${SUPPORTED_CHAIN_IDS({ testnetMode }).join(',')}/${address}/claimables`;
  const { data } = await addysHttp.get<Claimables>(url, {
    params: {
      currency: currency.toLowerCase(),
    },
    timeout: 20000,
  });
  return data;
}

type ClaimablesResult = QueryFunctionResult<typeof claimablesQueryFunction>;

// ///////////////////////////////////////////////
// Query Hook

export function useClaimables(
  { address, currency, testnetMode }: ClaimablesArgs,
  config: QueryConfigWithSelect<ClaimablesResult, Error, ClaimablesResult, ClaimablesQueryKey> = {}
) {
  return useQuery(claimablesQueryKey({ address, currency, testnetMode }), claimablesQueryFunction, {
    ...config,
    // staleTime: 1000 * 60 * 2, // Set data to become stale after 2 minutes
    // cacheTime: 1000 * 60 * 60 * 24, // Keep unused data in cache for 24 hours
    staleTime: 0,
    cacheTime: 0,
  });
}
