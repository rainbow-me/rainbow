# Solana-source swap expiry investigation — 2026-11-17

Status: the misleading gasless preparation is corrected locally. **Zero-SOL BONK → USDC execution is still blocked on backend source-fee sponsorship.** This patch rejects unsupported requests; it does not implement sponsorship or repair previously failed executions. No new swap was signed or broadcast during this investigation.

## Current MVP policy

Later on November 17, the user authorized wallet-paid Solana source fees. The BONK → Solana USDC and SOL → Base USDC buttons now omit `gasless`, require full provider sponsorship, and disclose the source fee. Both returned CONFIRMED in user-run tests; BONK/USDC balances were also checked. This does not enable zero-SOL selling. See [current routes and verification limits](solana-internal-mvp.md).

## Evidence

The simulator reported FAILED / SOLANA_BLOCKHASH_EXPIRED for two distinct execution IDs:

- `0xaeed2ff6f7e26ebaa201c4de6d24f08a532cf96815b2871abb171f785feb3ee2`
- `0xfd927b644c42554679678ae0111be08033f5eb2a0d0783eb933ff6cc68a564c3`

Each Dev Settings tap calls `execute.prepare.route` again. A new execution does not reuse the previous confirmation's quote. The app and Solscan showed 76,000.34993 BONK, 0 USDC, and 0 native SOL for `EXzw16qKGtrWTaTd5gGG29FWSUDrTEDheh5ber156MNS`.

An unsigned, read-only mainnet simulation with a fresh blockhash and that wallet as fee payer returned `AccountNotFound`, with no instruction logs. This was a minimal memo transaction to isolate fee-payer eligibility, not a replay of either failed swap. No private key was read, and no transaction was submitted. The original worker RPC errors have not been retrieved; identifying the exact rejection of either historical swap still requires worker logs.

## Responsible code in Christian's SDK/worker

Based on `@christian/solana` at `7df0f369cf4387d31190600ae4ea900f75df8d1c`:

1. `workers/relay-reference/gateway/src/solana/prepare.ts`, `prepareSolanaRouteInstructions`: explicitly compiles the route with `feePayer: wallet`.
2. `src/relay/prepareValidation.ts` and `src/solana/preparedTransaction.ts`: provider-backed Solana routes use `wallet-v0` verification, which requires the selected wallet as fee payer. A server-only sponsor change would therefore be rejected by the existing client.
3. `src/actions/internal/managedExecutionReview.ts` and `preflightRelay.ts`: gasless was inferred from absence of a `sendTransaction` wallet step. A Solana `signTransaction` step passed even though the signer was paying source gas. Worker broadcasting is not fee sponsorship.
4. `workers/relay-reference/gateway/src/state/solana-lifecycle.ts`, `sendRetainedTransaction`: RPC errors are caught and reduced to `false`; retries continue until the blockhash expires. `core/status.ts` then reports SOLANA_BLOCKHASH_EXPIRED. This can conceal the original preflight rejection.

Relay's provider fee sponsorship and Solana origin fee sponsorship are separate. The actual supported route and SDK validation guarantee a wallet-paid source; the zero-SOL payer is independently invalid even with a fresh blockhash. This is strong evidence for the failure mechanism, rather than proof from the unavailable worker logs.

## Client correction and undeployed Worker candidate

- SDK route reviews report `gasless: false` for the current wallet-paid Solana route format.
- SDK preflight rejects a gasless Solana route with an explicit backend-fee-sponsor error before signing/submission.
- Worker preparation rejects a gasless Solana route with SPONSORSHIP_UNAVAILABLE before calling Relay or RPC.
- Existing paid Solana routes, EVM routes, and the separately supported sponsored instruction-batch path remain available.

SDK source branch: `jin/solana-source-fee-guard` in `/Users/jin/rainbow_studio/smart-contract-sdks/sdk-worktrees/solana-source-fee-guard`.

Source diff: [solana-source-fee-guard.patch](solana-source-fee-guard.patch), based on the SHA above; excludes the separate ERC-3009/ApprovalProxy investigation.

Mobile worktree: `jin/solana-internal-mvp`. Its isolated preview SDK receives the client correction through [../patches/@rainbow-me+solana-sdk+0.5.0.patch](../patches/@rainbow-me+solana-sdk+0.5.0.patch). Both CommonJS and ESM are patched using the existing patch-package installation flow. No production SDK package, wallet store, or keychain changes are part of this correction.

The mobile client patch is included in the MVP branch; the SDK source worktree remains a separate, uncommitted candidate. No Worker deployment was made.

## Remaining work to enable zero-SOL swaps

1. Confirm the backend-controlled, funded mainnet sponsor and signing service. The gateway's Kora integration currently serves sponsored instruction batches, not provider asset routes; merely setting its environment variables does not connect it to the route path.
2. Request a provider transaction with the correct source sponsor (`depositFeePayer`), including account-creation rent coverage; compile with the sponsor as fee payer. Do not blindly replace wallet account roles in arbitrary instructions.
3. Have the sponsor validate and sign first on the backend, then extend SDK/worker route validation to verify the intended sponsor, permitted instructions, wallet authority, and existing sponsor signature before asking the wallet to sign. Preserve full-sponsorship enforcement and keep the sponsor secret off the mobile client.
4. Retain actionable, sanitized RPC preflight failure information in the worker instead of exposing only eventual expiry. Distinguish deterministic preflight rejection from uncertain submission/temporary RPC failure before altering terminal/retry semantics.
5. Deploy the compatible worker and SDK, then verify a user-confirmed BONK → USDC transaction, source/destination signatures, output minimum, sponsor-paid fees/rent, and unchanged zero-SOL user balance. Relay explicitly restricts same-chain `depositFeePayer` usage with untrusted users; keep this internal flow restricted and verify the sponsoring service's policy before broad rollout.

## Investigation-time validation

The new SDK regression failed before the correction (`gasless` was true despite a wallet-paid transaction and full provider sponsorship), then passed.

- SDK package: 1,271 tests passed.
- Gateway: 635 tests passed.
- Mobile MVP route/execution tests: 13 tests passed against the patched preview package.
- SDK build, SDK package type check, gateway type check, and changed-file ESLint passed.
- patch-package applied successfully, including the aliased preview SDK.
- Metro restarted only on dedicated port 8093. Runtime evidence is in the sibling MVP runtime directory. Successful sponsored Solana selling remains unverified and unsupported by this patch.

## Access and references

Worker: `https://relay-reference-gateway-production.c-63c.workers.dev`. Current local Cloudflare credentials do not provide access to that account. The hostname does not establish whether it is a personal account. Its owner can invite Jin's user to the Worker with Editor access, or deploy the patch themselves. Granting access alone does not implement the missing sponsorship path.

- [Relay Solana gasless swaps](https://docs.relay.link/features/gasless-swaps#gasless-swaps-on-solana)
- [Relay Solana origin sponsorship](https://docs.relay.link/features/fee-sponsorship#sponsoring-origin-deposits-with-depositfeepayer)
- [Solana fee abstraction](https://solana.com/docs/payments/send-payments/payment-processing/fee-abstraction)
- [Cloudflare Worker roles](https://developers.cloudflare.com/workers/authorization/workers/)
