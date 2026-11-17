# Internal Solana MVP

Branch: `jin/solana-internal-mvp`. Worktree: `rainbow-worktrees/solana-internal-mvp`.

Current as of November 17, 2026. This is an internal mainnet test harness for an existing mnemonic wallet. It enables a Solana address for the selected EVM subaccount, buys SOL with Base ETH, and supports wallet-paid Solana-source swaps. It requires the existing Solana feature flag and a non-store build. Each swap requires a fresh quote and explicit confirmation.

The branch starts at `53bfded42`, before the broader keychain foundation. It carries forward the proposed wallet types but leaves `walletKeychain.ts`, `features/local-auth/keychain.ts`, `walletsStore.ts`, and `model/wallet.ts` unchanged. The prior foundation and local simulator work remain in their original branch/worktree. The stacked `jin/solana-balances-v2` branch adds [wallet-screen balances](solana-balances-v2.md); this guide describes the underlying swap MVP.

## Review order

1. `src/features/wallet/data/enableSolanaAccount.ts` and `core/solanaAccount.ts`: authenticate the existing mnemonic, check that it owns the selected EVM address at the selected index, derive `m/44'/501'/<index>'/0'`, save the key, then publish metadata.
2. `src/features/wallet/data/solanaKeychain.ts` and `loadSolanaSigner.ts`: protected storage, canonical key/address validation, cancellation, readback, and an operation-scoped SDK signer.
3. `src/features/wallet/data/stores/accountMetadataStore.ts`: supplemental public mapping and an optional `getCombinedAccount` selector. Profiles, selection, ownership, and damaged status stay in the existing wallet store. `WalletDescriptor` remains available for later consumers; this harness only needs the account view.
4. `src/features/solana/core/mvpRoutes.ts`, `data/mvpSdk.ts`, and `data/mvpTrades.ts`: fixed assets and caps, isolated SDK configuration, quote policy, execution IDs, status and balances.
5. `src/features/solana/ui/SolanaMvpMenu.tsx` and its two-line `DevSection.tsx` integration: enable, buy, sell, refresh balances, and check execution.

## Storage contract

| Location                       | Key / index                                                  | Value                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Existing keychain              | `${walletId}_rainbowSeedPhrase`                              | Existing mnemonic record; unchanged                                                                                                      |
| New protected keychain record  | `rainbow.account-key.v1/solana/${rawSolanaAddress}`          | `{ address, privateKey, format: 'ed25519-seed-base64', version: 1 }`; privateKey is canonical base64 of the 32-byte Ed25519 account seed |
| New persisted public store     | `solanaAccountMetadata`, indexed by JSON `[walletId, index]` | `{ walletId, index, sourceEvmAddress, namespace: 'solana', address, version: 1 }`                                                        |
| New persisted execution record | `solanaMvpExecution`                                         | Last execution ID, source account, route, status; no quote, signatures, or secrets                                                       |

Keys are independent of network/cluster. Solana address case is preserved. The legacy `_rainbowPrivateKey` suffix is never used, so existing EVM key discovery/backup paths do not ingest Solana private keys. No extra mnemonic, binary seed, or private parent is persisted. Restore the mnemonic and enable the same index to reconstruct a missing key/mapping.

Solana uses the existing shared keychain policy: writes obtain options directly from `features/local-auth/keychain.getPrivateAccessControlOptions`; reads use `getObject` with an authentication prompt. No duplicated platform checks or changes to the shared wrapper are needed. Development iOS simulators use the existing EVM exception: no device-authentication requirement, simulator keychain storage, and MMKV caching. Use test wallets there. Device protection and any authentication required on writes are controlled by the shared wrapper, including Android PIN encryption.

Enablement is published only after successfully reading and validating the written record. A valid existing key is reused; an unreadable existing record is never overwritten automatically. Typed byte buffers are cleared after use; JavaScript strings and library-internal copies cannot be reliably zeroized.

Removed, hidden, damaged, or mismatched source accounts cannot use their mappings. Startup with an unready wallet store is also rejected. As with legacy secret records, this MVP retains protected keys on ordinary wallet removal; the existing full keychain wipe removes them. It does not add automatic per-wallet secret deletion or backup migration. Shared-address ownership must be handled before adding scoped deletion. A metadata-only reset is recoverable by enabling again; corrupted/unreadable protected records require separate recovery work rather than silent replacement.

## SDK and relay configuration

The checked-in SDK artifact comes from `@christian/solana-sdk` at `f37a88da5`, using that branch's `rainbow-me-sdk-0.5.0.tgz`. It is installed as **`@rainbow-me/solana-sdk`**, while production keeps **`@rainbow-me/sdk` 0.4**. Its SHA-256 is `111883fbb89a89588d2474ddb34da7ecaabbac9036116ff4b876eb5fb79ef823`.

The preview SDK's fixed delegation cache key would collide with production. Its configuration therefore disables persistence and synchronization for that cache, while retaining normal in-memory query state. It does not reconfigure the production SDK. Once Christian's changes merge, consolidate the dependency and configuration in a separate change.

The MVP uses **Christian's Cloudflare reference relay** through `RAINBOW_RELAY_URL`, `RAINBOW_RELAY_API_KEY` and `RAINBOW_RELAY_QUOTE_SIGNER`. Christian's [commit 3d12f2ea2](https://github.com/rainbow-me/rainbow/commit/3d12f2ea2edbd1792e460f2de667f3a135c3e567) disabled `GO_RELAY_BACKEND` for Solana testing. This adapter selects the reference relay directly, leaving the global Go flag and production relay behavior unchanged. Restart after changing relay environment values; SDK configuration is initialized once.

Set `RAINBOW_RELAY_URL=https://relay-reference-gateway-production.c-63c.workers.dev`, as specified in [Christian’s deployment instructions](https://linear.app/rainbow/issue/APP-3935/plan-out-solana-sdkrelay-integration#comment-e3abb2ce). The older `rainbowdotme.workers.dev` hostname does not expose the v2 routes used here. Add the new hostname to the generated native allowlist (`ios/Extras.json` for this simulator; `rainbow-scripts/rainbow/extras_content.sh` for build-time generation), then rebuild the app. Restart Metro with `--reset-cache` after changing `.env` so the bundle includes the new URL.

The Cloudflare service supplies the SDK's v2 prepare/execute/status endpoints. The MVP does not require the new Go-backend Solana implementation. The existing platform client remains configured for platform/delegation data. Sponsor authorization and transaction validation remain relay responsibilities.

Metro resolves `.mjs` files so the preview SDK's lazy ESM chunks load. The preview-package patch in `patches/@rainbow-me+solana-sdk+0.5.0.patch` corrects gasless reporting and rejects unsupported gasless Solana-source routes in both CommonJS and ESM. Repository patch-package installation applies it; it does not deploy a Worker or modify the production SDK package.

## Current test routes and fee policy

| Button                       | Source             | Destination                                        | Input and fee policy                                                                                       |
| ---------------------------- | ------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Buy SOL with $1 of Base ETH  | Base native ETH    | Mainnet native SOL, selected paired Solana address | $1 at a freshly fetched ETH/USD price, rounded down to wei; gasless and full provider sponsorship required |
| Buy BONK with $1 of Base ETH | Base native ETH    | Mainnet BONK, selected paired Solana address       | $1 at a freshly fetched ETH/USD price, rounded down to wei; gasless and full provider sponsorship required |
| Swap BONK → Solana USDC      | Mainnet BONK       | Mainnet USDC, same Solana address                  | Available BONK capped at 100,000; wallet pays source fee in SOL; full provider sponsorship required        |
| Swap 0.01 SOL → Base USDC    | Mainnet native SOL | Base USDC, associated EVM address                  | Exactly 10,000,000 lamports plus wallet-paid source fee; full provider sponsorship required                |

The user authorized wallet-paid Solana source fees for internal testing. Both Solana-source requests omit `gasless` (the SDK accepts `true` or omission) and retain `sponsorship: 'required'`. Both Base-source buy requests retain `gasless: true`. Confirmation discloses the source fee in SOL. The balance guard requires SOL greater than the input for the SOL route, or greater than zero for BONK; it is not an exact fee estimate. There is no automatic fallback from a gasless request to wallet-paid fees.

The ETH/USD lookup uses Rainbow's mainnet ETH price; the spend remains on Base. Missing or invalid prices block preparation. Price movement can change the USD value after pricing. Base USDC is the ERC-20 at `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`. Mint constants and decimals are in `core/mvpRoutes.ts`; references: [Circle USDC addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses), [BONK](https://solscan.io/token/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263).

Full sponsorship may include rent when the backend includes it. The longer-term gas-sponsored/user-paid-rent policy remains future work; this preview SDK does not expose separate rent sponsorship control. Preserve these test buttons and add separate buttons for future test routes.

Quote confirmation shows exact spend, quoted/minimum output, source, recipient and expiry. The Base route may authorize Rainbow EVM delegation; the confirmation discloses this. Execution checks the selected account and expiry again after unlocking. The exact opaque SDK prepared object is submitted, never reconstructed. SDK submission success records PENDING immediately, without a follow-up status request. Use Check execution to fetch confirmation separately; a failed status read preserves the pending state. A matching `ManagedExecutionFailedError` records FAILED and preserves the SDK error for display, allowing a fresh quote. An uncertain submission retains its execution ID across restart and blocks new swaps until status is terminal. Already submitted preparations cannot be reused, including after definite failure. A quote left indefinitely PREPARED after a failed submission needs backend investigation, not automatic resubmission or clearing the journal.

## Manual testing

1. Use Node 22.23.2 and normal Rainbow dependency/native setup (`yarn install`, repository patches, Pods and environment setup as needed). Configure the reference relay above. The dedicated simulator is **Rainbow Solana MVP**, with Metro on **8093**. Environment and generated native configuration are local setup, not committed feature changes.
2. In a non-store build, enable the Solana flag in Developer Settings. Select a mnemonic EVM account funded with at least $1 of Base ETH, then tap **Enable Solana for this account** and verify the displayed index/address.
3. Tap **Buy SOL with $1 of Base ETH**, review, and confirm. Use **Check execution** until terminal and **Refresh Solana balances** to inspect native SOL, BONK and Solana USDC. Native ETH avoids the blocked USDC permit path. The separate **Buy BONK with $1 of Base ETH** button follows the same flow and receives BONK instead; the existing SOL buy remains available.
4. With sufficient SOL for source fees, test **Swap 0.01 SOL → Base USDC** or **Swap BONK → Solana USDC** (requires BONK). Inspect both chains' receipts and balance changes; quote/status success alone does not establish amounts or fees.
5. Check cancellation and account-selection changes. Use a physical device to verify protected storage and authentication/cancellation. EVM signing/backup regressions, flag-off behavior and store-build isolation still need explicit verification before merge.

For assisted simulator tests, the agent may tap the test button, inspect review/errors, and investigate automatically. Stop before confirming or signing a mainnet transaction; the user performs that step.

## Verification and remaining limits

User-confirmed mainnet tests on November 17:

| Route              | Evidence                                                                                                                                                                                                                                                                                                                                   | Verification limit                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Base ETH → SOL     | [Base transaction](https://basescan.org/tx/0x5a90ad553e7fc02af26d24b1c8248e46d7cb417541e863fcd87c1fc271c5ce03), [Solana receipt](https://solscan.io/tx/3aaXLehpbJQayH4YFv7joEdJ9ae1ery8XjePvKTQQEUxttdnUAdPZYTboYYQ2YcLLoBDsPHwwTWnULyF9uygbo98); finalized without error; recipient native balance increased from zero to 0.013686013 SOL | Exact sponsor/rent allocation not audited              |
| SOL → Base USDC    | Execution `0x93ab4e68b32416d0822a5bc144eaeba82f7877ac7917f6e31f8e893f0f758f48` reported CONFIRMED                                                                                                                                                                                                                                          | Destination amount and fees not independently verified |
| BONK → Solana USDC | Execution `0x836f9c964085ba8f0e2b7f54576cd3cb7db26b4cf0f143e53199c8396d7c1e29` reported CONFIRMED; public RPC showed 0 BONK and 0.179207 Solana USDC afterward                                                                                                                                                                             | Exact fees not audited                                 |

These are historical test results, not a guarantee of current backend availability. No funded transaction was signed by the agent. Source/destination wallet: [Solana](https://solscan.io/account/EXzw16qKGtrWTaTd5gGG29FWSUDrTEDheh5ber156MNS), [Base](https://basescan.org/address/0x2e67869829c734ac13723A138a952F7A8B56e774).

Focused tests cover derivation indices 0/1/2, key/address validation, storage/readback/cancellation, source ownership and selection, scoped signing, bounded routes/sponsorship/expiry, SDK configuration and duplicate/uncertain submission. All 110 tests across nine focused suites passed during commit cleanup, including existing EVM wallet-keychain tests. TypeScript, changed-file ESLint, and dependency rules/cycle checks passed after the shared keychain-policy change. The simulator launches and serves the updated bundle. A release build and flag-off/store-build isolation tests have not been completed.

Remaining limitations:

- **USDC-source permit mismatch:** the deployed Worker rejects the captured Base USDC routes. [Investigation and diagnostic patch](relay-permit-contract-version.md) require further contract-selection work before deployment. ETH-source routes avoid this path.
- **Zero-SOL source sponsorship:** unsupported for these provider routes. [Investigation and source patch](solana-source-fee-investigation.md) explain the guard and required backend work. The SDK client guard is applied locally; the Worker patch is undeployed. Wallet-paid Solana tests do not validate zero-SOL sponsorship.
- **Internal UI and RPC:** hardcoded routes, public Solana RPC rate limits, and basic status presentation remain prototype limitations. The execution display still labels the EVM account as source for Solana-source routes and does not expose every destination receipt.
- **Production readiness:** physical-device/Android authentication and existing EVM regression checks remain. Keys are retained on ordinary wallet removal; unreadable-record recovery and backup migration are not added. No claim of merge readiness follows from focused test success.
- **Outside this branch:** portfolio/backend balances, arbitrary tokens, other wallet source types, bulk enablement, and gas-only sponsorship. Christian's newer SDK changes are not automatically incorporated; this branch uses the pinned artifact above.

Christian's [SDK documentation](https://app.notion.com/p/rainbowdotme/Solana-Support-in-the-SDK-40eb001b85b48028ad5ef443b0af1697) and [deployment comment](https://linear.app/rainbow/issue/APP-3935/plan-out-solana-sdkrelay-integration#comment-e3abb2ce) identify services under `c-63c.workers.dev` but do not name the owning Cloudflare account. Ask Christian which account owns the Worker and who can grant access. Neither diagnostic patch in `docs/` is applied by the mobile build or deploys a service.
