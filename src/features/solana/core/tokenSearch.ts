import { address } from '@solana/addresses';

import { type TokenSearchResult } from '@/features/token-search/core/tokenSearch';

import { isSolanaAddress } from './address';
import { SOLANA_MAINNET_CHAIN } from './chainId';
import { SOL, solanaToken } from './mvpRoutes';
import { SOLANA_SWAP_OUTPUTS, type SolanaSwapAsset } from './swap';

export function parseSolanaSearchResults(result: TokenSearchResult): SolanaSwapAsset[] {
  const assets = new Map<string, SolanaSwapAsset>();
  const prefix = `${SOLANA_MAINNET_CHAIN}/`;
  for (const section of result.sections ?? []) {
    if (section.type !== 'SECTION_TYPE_TOP' && section.type !== 'SECTION_TYPE_TOKENS') continue;
    for (const { token } of section.items ?? []) {
      if (!token?.symbol || token.verification === 'VERIFICATION_STATUS_SCAM' || token.risk?.level === 'RISK_LEVEL_HIGH') continue;
      for (const instance of token.instances ?? []) {
        if (typeof instance.assetId !== 'string' || !instance.assetId.startsWith(prefix)) continue;
        const [kind, mint, extra] = instance.assetId.slice(prefix.length).split(':');
        if (extra !== undefined || typeof mint !== 'string' || !isSolanaAddress(mint)) continue;
        const sdkMint = address(mint);
        const native = kind === 'native';
        if (native ? mint !== 'So11111111111111111111111111111111111111111' : kind !== 'token') continue;
        const decimals = native ? 9 : (instance.decimals ?? 0);
        if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) continue;
        const known = SOLANA_SWAP_OUTPUTS.find(item =>
          native ? item.asset.kind === 'native' : item.asset.kind === 'token' && item.asset.address === sdkMint
        );
        const id = known?.id ?? mint;
        if (assets.has(id)) continue;
        assets.set(id, {
          id,
          chain: 'solana',
          network: 'Solana',
          name: token.name || token.symbol,
          symbol: token.symbol,
          decimals,
          iconUrl: token.iconUrl,
          isVerified: token.verification === 'VERIFICATION_STATUS_VERIFIED',
          asset: native ? SOL : solanaToken(sdkMint),
        });
      }
    }
  }
  return [...assets.values()];
}
