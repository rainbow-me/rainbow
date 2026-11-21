# 1. Enable a paired Solana account

Start at `src/features/wallet/data/enableSolanaAccount.ts` (2 minutes): follow authentication → EVM ownership check → derive → protected write → publish public address.

An internal user with an existing mnemonic wallet can enable a Solana address for the selected EVM subaccount. Existing wallet selection, profile ownership, production keychain APIs, and legacy wallet types stay unchanged. The source is the previously tested MVP, reorganized onto develop `38757729b`; unused proposed wallet replacement types are deferred.

## Reading order (20–30 minutes)

1. `types.ts` defines additive wallet/account records; combined-profile types currently have no production consumer; `core/address.ts` validates raw addresses; `core/derivation.ts` uses `HDKey.fromMasterSeed(seed).derive(path)` for the same hardened path. The cookbook’s `micro-ed25519-hdkey` is deprecated; its maintained successor is `micro-key-producer/slip10.js`. Verify address and SLIP-0010 tests beside them.
2. `core/solanaAccount.ts` decodes/validates the separate key format; `data/solanaKeychain.ts` owns Base58 encoding and record format/version, shares existing authentication policy, and writes the mnemonic-derived key directly (replacing any existing record). Read their tests together.
3. `data/enableSolanaAccount.ts` verifies selected-account ownership; `data/stores/accountMetadataStore.ts` stores and retrieves public metadata by wallet ID and account index. `solanaWallet.test.ts` covers enablement failure, ownership and profile preservation. SDK signer coverage joins the execution PR.
4. `SolanaMvpMenu.tsx` exposes only Enable Solana behind the existing Solana feature gate; `DevSection.tsx` mounts it. There are no SDK imports or swap actions in this layer.
5. `package.json`/`yarn.lock` add Noble curves, base encoding and `micro-key-producer` for SLIP-0010 derivation; `AGENTS.md` preserves the agreed incremental-integration constraints.

The derivation dependency follows the cookbook’s BIP44 `HDKey.fromMasterSeed(seed).derive(path)` pattern using `micro-key-producer/slip10.js` (0.10.2). The cookbook still names `micro-ed25519-hdkey`, whose npm deprecation notice directs users to `micro-key-producer` for security updates. The successor adds transitive packages; the app imports only its SLIP-0010 entry point. Existing key/address vectors and the 32-byte signing seed are unchanged; persistence now encodes that seed as Base58. The single entry point is `deriveSolanaAccountNode(seed, accountIndex)`, with the fully hardened Solana path inlined. It returns the raw Base58 address alongside the private key and chain code; enablement passes the address and private-key bytes directly to `saveSolanaKey(address, privateKey)`. The removed `solanaKeyFromSeed` wrapper no longer constructs persistence records. Enablement clears the derived private key and chain code in `finally`, including on save failure. The unused local signer type, helper and their dedicated tests are removed; PR3 uses the SDK signer through `withSolanaSigner`. The unused address-only wrapper has been removed. The generic path-array function, intermediate wrapper and path-formatting helper are removed. HDKey validates indexes during derivation. Standard SLIP-0010 vectors exercise HDKey directly; application tests pin Solana addresses and signing behavior. The direct `@noble/hashes` dependency is removed; Noble remains used transitively and for our existing signing code.

## Current validation responsibilities

- `getSolanaSource` checks the selected wallet/account at entry. `getEnabledSolanaAccount` returns that account’s enabled Solana metadata or throws when unavailable. Enablement then verifies the mnemonic derives the captured EVM address.
- `saveSolanaKey` Base58-encodes the private-key bytes, adds `format: 'ed25519-seed-base58'` and `version: 1`, and writes directly, replacing an existing record. It does not decode the input key, check for an existing record, or read back the write. As with EVM, the shared setter does not surface a native `false` write result.
- `getSolanaAccount` and `publishSolanaAccount` only look up or save metadata by wallet ID/index. They do not validate record contents, current wallet existence, eligibility or ownership. Metadata can remain readable, or be published after an in-flight enablement, when the original wallet has been deleted.
- `readSolanaKey` decodes Base58 and validates 32-byte key length, canonical encoding and the derived address against the caller’s expected address. Record access and decoding happen inside the try/catch; there is no separate record-shape, stored-address or encoded-length precheck. Stored `address`, `version` and `format` are metadata and do not control decoding. Later PRs retain signing source checks and enforce wallet eligibility in the balances caller; these protections do not come from the metadata store.

## Manual checks (not run for this reorganization)

Re-enable any existing Base64 test accounts first and confirm their addresses remain unchanged. Enable subaccounts 0 and 1 and confirm stable, distinct Solana addresses; cancel recovery-phrase authentication and confirm no mapping is published; switch wallets during authentication and verify enablement completes for the original account without changing the new selection; delete the original wallet during persistence and verify the captured mapping is saved but the deleted wallet cannot be used as a Solana source; verify private-key, hardware, watched and damaged wallets are rejected; verify flag-off EVM behavior.

The broader WalletDescriptor/source-material proposals remain on the original branches. The derivation path is unchanged. Existing Base64 records are not migrated or accepted by the new reader; re-enabling each mnemonic subaccount overwrites its record with Base58 at the same keychain entry. The format is now `ed25519-seed-base58`; the record version remains 1.

## Changed-file inventory

- `AGENTS.md`
- `package.json`
- `src/features/debug/screens/DevSection.tsx`
- `src/features/solana/core/address.test.ts`
- `src/features/solana/core/address.ts`
- `src/features/solana/core/derivation.test.ts`
- `src/features/solana/core/derivation.ts`
- `src/features/solana/ui/SolanaMvpMenu.tsx`
- `src/features/wallet/core/solanaAccount.test.ts`
- `src/features/wallet/core/solanaAccount.ts`
- `src/features/wallet/data/enableSolanaAccount.ts`
- `src/features/wallet/data/solanaKeychain.test.ts`
- `src/features/wallet/data/solanaKeychain.ts`
- `src/features/wallet/data/solanaWallet.test.ts`
- `src/features/wallet/data/stores/accountMetadataStore.ts`
- `src/features/wallet/types.ts`
- `yarn.lock`

Validation: 80 focused PR1 tests passed after the Base58 change; the complete stack passes 356 tests. TypeScript passed on the updated stack. Dependency checks passed on PR1 and the updated full stack. ESLint has no errors (existing non-null assertion warnings remain in the copied tests). Native visual/authentication checks remain pending.

Solana eligibility uses the existing `useIsSolanaEnabled` gate, with no store-install restriction. Store builds use remote `solana_enabled`; internal builds also honor the existing local experimental override. The source-entry check in `getSolanaSource` enforces wallet readiness, mnemonic type, visibility and damaged status. The metadata store itself performs no eligibility checks.

Enablement captures its source account once. Selection changes during authentication, derivation or key persistence do not cancel it; mnemonic ownership is verified against the captured EVM address. Metadata access does not revalidate wallet existence or eligibility; records may remain after wallet deletion. Source eligibility is checked by `getSolanaSource`. `assertSolanaSource` remains for signing and transaction operations.
