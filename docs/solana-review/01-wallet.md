# 1. Enable a paired Solana account

Start at `src/features/wallet/data/enableSolanaAccount.ts` (2 minutes): follow authentication → EVM ownership check → derive → protected write/readback → publish public address.

An internal user with an existing mnemonic wallet can enable a Solana address for the selected EVM subaccount. Existing wallet selection, profile ownership, production keychain APIs, and legacy wallet types stay unchanged. The source is the previously tested MVP, reorganized onto develop `38757729b`; unused proposed wallet replacement types are deferred.

## Reading order (20–30 minutes)

1. `types.ts` adds only records consumed by this implementation; `core/address.ts` validates raw addresses; `core/derivation.ts` derives the same hardened path. Verify address and SLIP-0010 tests beside them.
2. `core/solanaAccount.ts` encodes/validates the separate key format; `data/solanaKeychain.ts` shares existing authentication policy, writes the mnemonic-derived key (replacing any existing record), and reads back writes. Read their tests together.
3. `data/enableSolanaAccount.ts` and `data/stores/accountMetadataStore.ts` verify selected-account ownership before publishing public metadata. `solanaWallet.test.ts` covers enablement failure, ownership and profile preservation. SDK signer coverage joins the execution PR.
4. `SolanaMvpMenu.tsx` exposes only Enable Solana behind the existing Solana feature gate; `DevSection.tsx` mounts it. There are no SDK imports or swap actions in this layer.
5. `package.json`/`yarn.lock` add Noble curves/hashes and base encoding; `AGENTS.md` preserves the agreed incremental-integration constraints.

## Manual checks (not run for this reorganization)

Enable subaccounts 0 and 1 and confirm stable, distinct Solana addresses; cancel authentication and confirm no mapping is published; switch wallets during authentication and verify enablement completes for the original account without changing the new selection; delete the original wallet during persistence and verify no mapping is published; verify private-key, hardware, watched and damaged wallets are rejected; verify flag-off EVM behavior.

The broader WalletDescriptor/source-material proposals remain on the original branches. No secret record format or derivation path is migrated here.

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

Validation: 80 focused tests passed; TypeScript and dependency checks passed. ESLint has no errors (existing non-null assertion warnings remain in the copied tests). Native visual/authentication checks remain pending.

Solana eligibility uses the existing `useIsSolanaEnabled` gate, with no store-install restriction. Store builds use remote `solana_enabled`; internal builds also honor the existing local experimental override. Wallet eligibility, authentication and account validation are unchanged.

Enablement captures its source account once. Selection changes during authentication, derivation or key persistence do not cancel it; mnemonic ownership is verified against the captured EVM address. Existing `publishSolanaAccount` validation still rejects deleted or invalidated source accounts. `assertSolanaSource` remains for signing and transaction operations.
