import { type Address } from 'viem';

import { type AddressOrEth } from '@/__swaps__/types/assets';
import { SOLANA_BALANCES } from '@/features/config/constants/experimental';
import { getExperimentalFlag } from '@/features/config/stores/experimentalConfigStore';
import { SOLANA_LOCAL_CHAIN_ID, SOLANA_NATIVE_ASSET_REFERENCE } from '@/features/solana/constants';

import { type BackendNetwork } from '../types/backendNetworks';

/**
 * Solana's per-chain display metadata, held app-side rather than published in the
 * network catalog. This is the app-local half of the CAIP-native route: the wire
 * carries `solana:5eykt4...`, and everything downstream that needs a chain to have
 * a name, a label, a badge and a native asset reads it from here.
 *
 * Two things about this entry are worth knowing before extending it.
 *
 * It is deliberately absent from `backendChains`. `transformBackendNetworkToChain`
 * builds a viem `Chain` with an EVM JSON-RPC endpoint out of every entry it is
 * given, so a Solana entry reaching that array would put a broken provider behind
 * `getProvider(SOLANA_LOCAL_CHAIN_ID)`. `withSolanaNetwork` therefore joins the
 * `backendNetworks` array the record selectors reduce over, and nothing else.
 *
 * And `BackendNetwork` cannot describe Solana honestly. Its `nativeAsset.address`
 * is `AddressOrEth` and `nativeWrappedAsset.address` is viem's `Address`, both hex,
 * so a Solana entry either casts or lies about its values. The cast below is the
 * honest half: `isNativeAsset` compares an asset's address to this field, so the
 * SOL mint has to be the real one for a SOL row to be recognized as the chain's own
 * currency. `nativeWrappedAsset` is the dishonest half, and it is set to the same
 * reference because Solana has no wrapped-native concept in the EVM sense; no app
 * code reads that field for any chain.
 */
export const SOLANA_BACKEND_NETWORK: BackendNetwork = {
  id: String(SOLANA_LOCAL_CHAIN_ID),
  name: 'solana',
  label: 'Solana',
  colors: {
    light: '#14F195',
    dark: '#14F195',
  },
  icons: {
    // Rainbow's badge CDN serves no `networks/solana` entry, so a real route
    // needs one published there first.
    badgeURL:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  },
  testnet: false,
  internal: false,
  opStack: false,
  defaultExplorer: {
    url: 'https://solscan.io',
    label: 'Solscan',
    transactionURL: 'https://solscan.io/tx/',
    tokenURL: 'https://solscan.io/token/',
  },
  // Empty by construction: Solana is absent from `backendChains`, so no provider is
  // ever built from this entry, and `enabledDevices` being empty keeps it that way
  // for anything that consults the field directly.
  defaultRPC: {
    enabledDevices: [],
    url: '',
  },
  // Solana has no gas market in these terms. The values are zero rather than
  // plausible, so a caller that reaches them produces an obvious wrong answer
  // rather than a believable one.
  gasUnits: {
    basic: {
      approval: '0',
      swap: '0',
      swapPermit: '0',
      eoaTransfer: '0',
      tokenTransfer: '0',
    },
    wrapped: {
      wrap: '0',
      unwrap: '0',
    },
  },
  nativeAsset: {
    address: SOLANA_NATIVE_ASSET_REFERENCE as AddressOrEth,
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    iconURL:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    colors: {
      primary: '#14F195',
      fallback: '#9945FF',
      shadow: '',
    },
  },
  nativeWrappedAsset: {
    address: SOLANA_NATIVE_ASSET_REFERENCE as unknown as Address,
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    iconURL:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    colors: {
      primary: '#14F195',
      fallback: '#9945FF',
      shadow: '',
    },
  },
  // Every Rainbow service that keys off a numeric chain id refuses Solana today, so
  // every one of these is false. That is not a placeholder: it is what keeps the
  // chain out of `getSwapSupportedChainIds`, `getMeteorologySupportedChainIds`,
  // `getSponsorshipEligibleChainIds` and the rest without any of them needing to
  // know Solana exists.
  enabledServices: {
    meteorology: { enabled: false },
    notifications: { enabled: false },
    swap: { enabled: false, swap: false, swapExactOutput: false, bridge: false, bridgeExactOutput: false },
    addys: { approvals: false, transactions: false, assets: false, positions: false, interactionsWith: false },
    tokenSearch: { enabled: false },
    nftProxy: { enabled: false },
    sponsorship: { enabled: false },
    launcher: { v1: { enabled: false, contractAddress: '0x' as Address } },
  },
};

/**
 * The network list the record selectors see: the fetched catalog, plus any chain
 * this app describes itself. Gated on the Solana balances flag, so with the flag
 * off the array is the fetched one, identity included.
 */
export function withSolanaNetwork(networks: BackendNetwork[]): BackendNetwork[] {
  if (!getExperimentalFlag(SOLANA_BALANCES)) return networks;
  return [...networks, SOLANA_BACKEND_NETWORK];
}
