# Rainbow EVM and Solana wallet abstraction

## Implementation status — November 5, 2026

Types checkpoint: commit `ebf6e06c8c` on `jin/solana-derivation-simulator`.
This branch includes the raw-address keychain revision, which supersedes the
checkpoint's CAIP-10 wallet-address and wallet/account-bound key-storage design.

`WalletAddress = EthereumAddress | SolanaAddress` means raw addresses only.
The existing EVM alias is still `string`, so this is a semantic contract rather
than compile-time exclusion of CAIP strings. Runtime keychain validation rejects
CAIP-qualified addresses. Existing branded Solana address helpers remain intact.
CAIP-10 is constructed only at integration boundaries that require it.

Use `getPrivateKey(address, auth?)` and `savePrivateKey(address, privateKey, auth?)`
for EVM and Solana. Existing raw EVM inputs retain their legacy storage names,
JSON shape, checksum fallback, and return convention. Solana support is behind
the existing flag and uses the new private-only keychain primitives. The getter
returns a record, null, UserCanceled, or NotAuthenticated as before; the setter
resolves void on success and rejects on failure. New Solana keys are canonical
base64-encoded 32-byte Ed25519 seeds, verified against their raw public address.
`PrivateKeyData.format` is optional for legacy compatibility and required on new
`AccountPrivateKeyData` records.

New records contain only `address`, `privateKey`, `format`, and `version`, under
`rainbow.account-key.v1/<namespace>/<normalized-raw-address>`. There is no wallet
ID, account index, network, or cluster in that storage identity. The namespace is
inferred from the supported raw address, not supplied by the caller. No EVM data
is migrated. Old unshipped prototype records using wallet/index/CAIP bindings are
not automatically discovered or migrated; future provisioning can recreate
mnemonic-derived keys. No automatic deletion is performed.

`SingleAddressAccount` has a raw address plus separate namespace. Public
`AccountMetadataRecord` contains wallet ID, index, namespace, address, and version.
`AccountKeyBinding` adds provenance to that ownership association, independently
of private-key storage. `KeyOrigin` uses raw `sourceAddress` and separate
`sourceNamespace`. Watch-only metadata does not acquire signing permission merely
because a matching address has a stored key. The future signer loader must check
ownership, wallet kind, selection, and network before calling the keychain.

`readWalletMnemonic` still reads the existing wallet-ID-based source record.
`removeAccountKey(rawAddress)` removes only the new-format record; callers must
first establish that no owning wallet needs it. It is not wired into wallet deletion.
The metadata store, provisioning, ownership-aware deletion, signer loaders, and
SDK integration remain unimplemented. Private storage fails closed on the iOS
simulator. Physical-device authentication and persistence remain unverified.

The complete working findings are stored outside Git worktrees:

[Open the findings](/Users/jin/rainbow_studio/chats/solana-wallet-abstraction/findings.md)

Permanent directory: `/Users/jin/rainbow_studio/chats/solana-wallet-abstraction/`.

Maintain the findings and related research artifacts in that directory. This file
is a locator; deleting this worktree does not remove the findings.

To continue in another session:

> Read /Users/jin/rainbow_studio/chats/solana-wallet-abstraction/findings.md and
> inspect the current Rainbow checkout. Update the findings and open decisions.

The original ChatGPT Page had loading errors. Use the local findings document as
the working record.
