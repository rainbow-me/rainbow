import { describe, expect, it } from 'vitest';

import { type TokenSearchItem, type TokenSearchToken } from '@/features/token-search/core/tokenSearch';

import { SOLANA_MAINNET_CHAIN } from './chainId';
import { SOL } from './mvpRoutes';
import { SWAP_ASSETS, swapInputAmount, validateSwapReview, type SwapReview } from './swap';
import { parseSolanaSearchResults } from './tokenSearch';

const mint = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN';
function token(overrides: Partial<TokenSearchToken> = {}): TokenSearchItem {
  return {
    id: 'jup',
    token: {
      name: 'Jupiter',
      symbol: 'JUP',
      iconUrl: 'https://example.com/jup.png',
      verification: 'VERIFICATION_STATUS_UNVERIFIED',
      risk: { level: 'RISK_LEVEL_CAUTION' },
      instances: [{ assetId: `${SOLANA_MAINNET_CHAIN}/token:${mint}`, decimals: 6 }],
      ...overrides,
    },
  };
}
function parse(items: TokenSearchItem[]) {
  return parseSolanaSearchResults({ sections: [{ type: 'SECTION_TYPE_TOP', items }] });
}

describe('Solana search results', () => {
  it('keeps arbitrary unverified tokens, mint case, decimals and backend icons, and removes duplicate deployments', () => {
    const results = parse([token(), token()]);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: mint,
      decimals: 6,
      symbol: 'JUP',
      isVerified: false,
      iconUrl: 'https://example.com/jup.png',
      asset: { kind: 'token', address: mint },
    });
    expect(swapInputAmount('1.234567', results[0])).toBe(1234567n);
    expect(() => swapInputAmount('1.2345678', results[0])).toThrow();
  });
  it('keeps native SOL distinct from wrapped SOL and uses the native decimals', () => {
    const results = parse([
      token({ instances: [{ assetId: `${SOLANA_MAINNET_CHAIN}/native:So11111111111111111111111111111111111111111` }] }),
      token({ instances: [{ assetId: `${SOLANA_MAINNET_CHAIN}/token:So11111111111111111111111111111111111111112`, decimals: 9 }] }),
    ]);
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ id: 'sol', decimals: 9, asset: SOL });
    expect(results[1].asset.kind).toBe('token');
  });
  it('keeps zero-decimal tokens usable', () => {
    const [asset] = parse([token({ instances: [{ assetId: `${SOLANA_MAINNET_CHAIN}/token:${mint}` }] })]);
    expect(asset.decimals).toBe(0);
    expect(swapInputAmount('3', asset)).toBe(3n);
    expect(() => swapInputAmount('3.1', asset)).toThrow();
  });
  it('excludes scams, high-risk tokens, wrong networks and invalid identities or precision', () => {
    expect(
      parse([
        token({ verification: 'VERIFICATION_STATUS_SCAM' }),
        token({ risk: { level: 'RISK_LEVEL_HIGH' } }),
        token({ symbol: '' }),
        ...[
          'eip155:8453/erc20:0x1234',
          `${SOLANA_MAINNET_CHAIN}/token`,
          `${SOLANA_MAINNET_CHAIN}/token:`,
          `solana:devnet/token:${mint}`,
          `${SOLANA_MAINNET_CHAIN}/native:${mint}`,
          `${SOLANA_MAINNET_CHAIN}/token:invalid`,
          `${SOLANA_MAINNET_CHAIN}/token:${mint}:extra`,
        ].map(assetId => token({ instances: [{ assetId, decimals: 6 }] })),
        ...[-1, 1.5, 256, NaN].map(decimals => token({ instances: [{ assetId: `${SOLANA_MAINNET_CHAIN}/token:${mint}`, decimals }] })),
      ])
    ).toEqual([]);
  });
  it('validates an arbitrary output mint and decimals again before submission', () => {
    const [asset] = parse([token()]);
    const trade = {
      inputAsset: SWAP_ASSETS['base-eth'],
      outputAsset: asset,
      input: 1n,
      prepared: {
        review: {
          inputAmount: 1n,
          sponsorship: 'full',
          gasless: true,
          expiresAt: BigInt(Math.floor(Date.now() / 1000) + 60),
          output: { asset: asset.asset, decimals: 6, amount: 10n, minimumAmount: 9n },
        },
      },
    } as SwapReview;
    expect(() => validateSwapReview(trade)).not.toThrow();
    const changed = {
      ...trade,
      prepared: {
        ...trade.prepared,
        review: { ...trade.prepared.review, output: { ...trade.prepared.review.output, asset: SWAP_ASSETS.bonk.asset } },
      },
    };
    expect(() => validateSwapReview(changed)).toThrow('expected output');
  });
});
