# 3. Prepare and execute Solana swaps

Start at `src/features/solana/data/mvpTrades.ts` (2 minutes): trace `prepareSwapTrade` to `executeMvpTrade` and the persisted uncertain-submission record.

This layer adds execution services and tests, without exposing swap controls. Existing EVM SDK version from develop stays unchanged; the Solana preview has a separate package alias and transient cache. Wallet source validation remains authoritative.

## Reading order (25–35 minutes)

1. `loadSolanaSigner.ts` authenticates and limits signer lifetime/cluster; its added lifecycle test covers signature, account changes and capability expiry.
2. `mvpRoutes.ts`, `swap.ts` and `swapTypes.ts` define supported assets, amounts, fee reserve, minimum output and quote expiry checks; compare their tests. Existing fixed-route helper APIs remain for compatibility/testing, but only SOL → Base USDC gets a developer action in the final layer.
3. `mvpSdk.ts` isolates preview configuration/cache and retains bounded prepared messages for fee estimation; read configuration tests.
4. `mvpTrades.ts` handles funds checks, exact prepared-object submission, sponsorship, source fees and uncertain outcomes; read its tests before reviewing success/error paths.
5. `package.json`, `yarn.lock`, Metro and the preview patch/tarball establish the build boundary. The tarball and patch are byte-identical to the preserved working branch. The SDK source counterpart is https://github.com/rainbow-me/sdk/tree/jin/solana-source-fee-guard; its worker guard is not deployed by this PR.

## Runtime configuration and limits

Internal mainnet testing uses `RAINBOW_RELAY_URL`, `RAINBOW_RELAY_API_KEY`, and `RAINBOW_RELAY_QUOTE_SIGNER` for Christian's Cloudflare v2 relay. Do not commit their values. Public Solana mainnet RPC and the preview package are internal-MVP choices requiring review before broader rollout. Solana source fees are wallet-paid; full provider sponsorship does not mean source gas is free. No network service is deployed by this stack.

Native bundle verification, device authentication, service availability and funded swaps are not established by unit tests.

## Changed-file inventory

- `metro.config.js`
- `package.json`
- `patches/@rainbow-me+solana-sdk+0.5.0.patch`
- `rainbow-me-sdk-solana-mvp-0.5.0.tgz`
- `src/features/solana/core/mvpRoutes.test.ts`
- `src/features/solana/core/mvpRoutes.ts`
- `src/features/solana/core/swap.test.ts`
- `src/features/solana/core/swap.ts`
- `src/features/solana/data/mvpSdk.test.ts`
- `src/features/solana/data/mvpSdk.ts`
- `src/features/solana/data/mvpTrades.test.ts`
- `src/features/solana/data/mvpTrades.ts`
- `src/features/solana/data/swapTypes.ts`
- `src/features/wallet/data/loadSolanaSigner.ts`
- `src/features/wallet/data/solanaWallet.test.ts`
- `yarn.lock`

This guide and its listed 16 implementation/configuration/test files define this layer.

Validation: 158 wallet/balances/execution tests, TypeScript and dependency checks passed. The tarball and preview patch match the preserved branch byte-for-byte. Existing EVM swap tests also pass (149 tests) before presentation extraction.
