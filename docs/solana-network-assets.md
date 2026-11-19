# Solana network assets — DES-190

Branch: `jin/solana-network-assets`. Base: `6edcd50ed`, a snapshot of the existing swap UI. The original swap UI checkout and its running simulator remain in place.

## Sources

- [Slack request](https://rainbowhaus.slack.com/archives/C0B550KTXJT/p1795036035320159)
- [DES-190 — Design Assets for Solana](https://linear.app/rainbow/issue/DES-190/design-assets-for-solana-blockchain-support): Andrei's `solana-icons.zip` export and light `#000100`, dark `#373737`, shadow `#25E6B2` colors.

## Scope and reading order

1. `src/features/network/components/ChainImage.tsx`: optional bundled image source; existing EVM callers still resolve their badge through the backend registry. Sizing, placement, visibility, and dark-mode clipping are shared.
2. `src/features/solana/constants/networkAssets.ts` and `src/assets/networks/solana/`: original exported `badge_large3x.png` and `uncropped_large3x.png`, renamed to React Native `@3x` assets; no generated artwork or remote URLs.
3. `SolanaSwapControls.tsx`: native SOL icon, SOL colors/shadow, network badges on the swap list and amount cards. The small slider icon has no badge, matching the existing Base treatment.
4. `SolanaBalanceRow.tsx`: network badge beside the existing backend token icon or letter fallback. Existing Solana feature gating controls all these callers; no EVM chain ID or wallet data migration is introduced.
5. Review [the full stack](solana-review-plan.md) and run [the swap matrix](solana-swap-test-plan.md); record results in [the CSV](solana-swap-test-results.csv).

The bundled badge source is a temporary presentation bridge until the backend network registry supports Solana. Token search/USDC/BONK icon metadata remains outside this change. The other exported icon variants are not needed by these surfaces and are not bundled.

## Manual visual checks (5 minutes, no transaction required)

1. With the Solana flag off, compare EVM wallet rows, Base badges, and the ordinary EVM swap screen with the previous build.
2. Enable Solana for an existing mnemonic subaccount. Confirm SOL/USDC/BONK wallet rows show their existing token icon and a Solana badge, without overlapping the name or balance.
3. In the normal swap sheet, inspect SOL/USDC/BONK rows and the input/output amount cards. SOL has the supplied logo; all three show the network badge. Base retains its Base badge.
4. Repeat in dark mode; check badge clipping, black/dark-gray SOL control colors, and legibility. Move the percentage slider and confirm its small icon remains unbadged.
5. Disable Solana again and verify its rows/options disappear as before. Network artwork must not enable any Solana path itself.

Automated validation results are recorded with the branch handoff. These visual checks and the mainnet swap matrix are not implied passes.

## Automated verification

- TypeScript: `tsc --noEmit` passed using the existing worktree’s generated GraphQL types, debug configuration, and network registry.
- Focused Vitest: 20 tests passed across shared chain badges, balance-row metadata fallback, swap token rows, and swap flow.
- Targeted ESLint: passed without warnings. Dependency check: no new violations. `git diff --check`: passed.
- Both PNGs are byte-for-byte copies of the designer’s exports. All local links in the three review/test guides resolve.

No simulator was restarted, no native visual test was run, and no transaction was submitted for this change.
