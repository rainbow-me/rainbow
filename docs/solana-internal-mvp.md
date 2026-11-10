# Internal Solana MVP

Branch: `jin/solana-internal-mvp`. Worktree: `rainbow-worktrees/solana-internal-mvp`.

This is an internal mainnet test harness for an existing mnemonic wallet: enable its selected subaccount, buy BONK with 1 Base USDC, then swap up to 100,000 BONK into Solana USDC. It requires the existing Solana flag and a non-store build. Each swap requires a fresh quote and explicit confirmation.

The branch starts at `53bfded42`, before the broader keychain foundation. It carries forward the proposed wallet types but leaves `walletKeychain.ts`, `features/local-auth/keychain.ts`, `walletsStore.ts`, and `model/wallet.ts` unchanged. The prior foundation and local simulator work remain in their original branch/worktree.

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

The wrapper must return private access-control options; simulator paths that return empty options are rejected. It must successfully read and validate the written record before enablement is published. A valid existing key is reused; an unreadable existing record is never overwritten automatically. Typed byte buffers are cleared after use; JavaScript strings and library-internal copies cannot be reliably zeroized.

Removed, hidden, damaged, or mismatched source accounts cannot use their mappings. Startup with an unready wallet store is also rejected. As with legacy secret records, this MVP retains protected keys on ordinary wallet removal; the existing full keychain wipe removes them. It does not add automatic per-wallet secret deletion or backup migration. Shared-address ownership must be handled before adding scoped deletion. A metadata-only reset is recoverable by enabling again; corrupted/unreadable protected records require separate recovery work rather than silent replacement.

## SDK and sponsorship

The checked-in SDK artifact comes from `@christian/solana-sdk` at `f37a88da5`, using that branch's `rainbow-me-sdk-0.5.0.tgz`. It is installed as **`@rainbow-me/solana-sdk`**, while production keeps **`@rainbow-me/sdk` 0.4**. Its SHA-256 is `111883fbb89a89588d2474ddb34da7ecaabbac9036116ff4b876eb5fb79ef823`.

The preview SDK's fixed delegation cache key would collide with production. Its configuration therefore disables persistence and synchronization for that cache, while retaining normal in-memory query state. It does not reconfigure the production SDK. Once Christian's changes merge, consolidate the dependency and configuration in a separate change.

The user approved **full sponsorship for internal testing**, including rent when included by the backend. Both requests specify `gasless: true` and `sponsorship: 'required'`; review validation also requires `full` sponsorship. No user-paid gas fallback is allowed. The longer-term gas-sponsored/user-paid-rent product policy remains future work: this SDK does not expose separate rent sponsorship control.

The MVP uses **Christian's Cloudflare reference relay** through `RAINBOW_RELAY_URL`, `RAINBOW_RELAY_API_KEY` and `RAINBOW_RELAY_QUOTE_SIGNER`. Christian's [commit 3d12f2ea2](https://github.com/rainbow-me/rainbow/commit/3d12f2ea2edbd1792e460f2de667f3a135c3e567) disabled `GO_RELAY_BACKEND` for Solana testing. This adapter selects the reference relay directly, leaving the global Go flag and production relay behavior unchanged. Restart after changing relay environment values; SDK configuration is initialized once.

The Cloudflare service supplies the SDK's v2 prepare/execute/status endpoints, so the MVP does **not** require the new Go-backend Solana implementation. The existing platform client is still configured for platform/delegation data. Sponsor authorization and transaction validation remain relay responsibilities. Full sponsorship and the currently deployed Worker's support for both routes still need live verification; a failed quote must not trigger a user-paid fallback.

| Route       | Source                                                  | Destination                                                  | Maximum input                                             |
| ----------- | ------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| Buy         | Base USDC, `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | Mainnet BONK, `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263` | 1 USDC, 6 decimals                                        |
| Return swap | Mainnet BONK                                            | Mainnet USDC, `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | Available BONK balance capped at 100,000 BONK, 5 decimals |

Mint references: [Circle USDC contract addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses), [BONK mint and decimals](https://solscan.io/token/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263).

Quote confirmation shows exact spend, quoted/minimum output, source, recipient and expiry. The Base route may authorize Rainbow EVM delegation; the confirmation discloses this. Execution checks the selected account and expiry again after unlocking. The exact opaque SDK prepared object is submitted, never reconstructed. SDK submission success records PENDING immediately, without a follow-up status request. Use Check execution to fetch confirmation separately; a failed status read preserves the pending state. A matching `ManagedExecutionFailedError` records FAILED and preserves the SDK error for display, allowing a fresh quote. An uncertain submission retains its execution ID across restart and blocks new swaps until status is terminal. Already submitted preparations cannot be reused, including after definite failure. A quote left indefinitely PREPARED after a failed submission needs backend investigation, not automatic resubmission or clearing the journal.

## Try it on a physical test device

1. Use Node 22.23.2 for this worktree. Run the normal Rainbow dependency/native setup (`yarn install`, repository patches, Pods/environment setup as needed). The Node 26 install hit an existing allow-scripts/yargs loader error; Node 22 succeeded. No shared Pods, Metro process, or simulator was changed for this branch.
2. Open Developer Settings in a non-store build, enable the existing Solana flag, select a mnemonic EVM account with at least 1 USDC on Base, and tap **Enable Solana for this account**. Confirm the displayed index/address.
3. Tap **Buy BONK with 1 Base USDC**, review and confirm. Use **Check execution** until confirmed, then **Refresh Solana balances**. An initially empty Solana account/absent ATA is part of the required device test.
4. Restart the app. Select the same account, then **Swap BONK → Solana USDC**, review and confirm. Check execution and balances again. This exercises the persisted Solana key.
5. Repeat cancellation and selection-change checks. Confirm existing EVM signing and backup behavior remains unchanged. Verify the configured Cloudflare relay supports full sponsorship for both routes before funded testing.

## Verification and limits

Submission-result correction verified on November 10, 2026: 74 focused tests pass; TypeScript passes. The initial November 5 verification also passed the existing JS type baseline and dependency rules/cycle baselines; changed-file ESLint had no errors (warnings in test assertions and the pre-existing DevSection `any`).

Focused tests cover indices 0/1/2, key formats and mismatches, protected storage/readback/cancellation, source ownership and selection changes, scoped signing and byte clearing, quote caps/sponsorship/expiry, both SDK adapter routes, and duplicate/uncertain submissions. Legacy wallet keychain tests are included.

The iOS JavaScript bundle builds with Metro. Physical-device keychain behavior, native app launch, live Cloudflare relay compatibility, actual sponsorship/rent allocation and funded end-to-end swaps remain unverified. No live transaction was submitted. Public mainnet Solana RPC is used for this internal harness and may rate-limit. Production portfolio integration, arbitrary tokens, additional wallet source types, bulk enablement and gas-only sponsorship are intentionally outside this branch.
