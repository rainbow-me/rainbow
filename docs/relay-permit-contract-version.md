# Relay permit mismatch — November 17, 2026

> **Correction after checking Relay’s migration guide:** the patch is a tested diagnostic candidate, not deployment-ready. Relay changed the default contract fields to v3.2 on October 26, 2026, while ERC-3009 quotes without `useMulticallAuthorization: true` continue using v3 during the transition. Contract selection therefore cannot be inferred solely from quote `protocolVersion: 'v2'`. The original patch fixes the captured sponsored USDC quote but needs its selection rule revised before deployment, with coverage for unsponsored USDC and Permit2. The 638 passing tests do not establish full migration compatibility.
>
> Sources: https://docs.relay.link/references/api/api_resources/contract-addresses.md and https://docs.relay.link/features/gasless-swaps.md . Christian’s current Base ↔ Solana demo does not explicitly require sponsorship; its exact live outcome has not been tested. Equivalent legacy USDC-permit routes through the same unpatched worker are expected to encounter the same mismatch, while Solana-source routes do not use this EVM permit validator.

Status: root mismatch reproduced; initial SDK patch tested but requires revision against the documented migration rules; not deployed. The simulator still encounters the deployed backend error. Do not describe the swap flow as working until the actual app reaches review and funded execution is separately verified.

## Reproduction and cause

Tapped **Buy BONK with 1 Base USDC** in the dedicated Rainbow Solana MVP simulator on Metro 8093. Observed HTTP 502: `Relay permit does not match the selected source`. No signature or execution was requested.

The current SDK branch (`@christian/solana`, `7df0f369cf4387d31190600ae4ea900f75df8d1c`) requests Relay.link `protocolVersion: 'v2'` for full sponsorship, but reads permit contracts from the unversioned `/chains` fields. These protocol versions are separate from Rainbow's `/v2/executions` API version.

A public unsigned Base USDC → BONK quote using a synthetic EVM account and the SDK demo's public Solana recipient reproduced the mismatch:

| Field                                  | Observed value                                                          |
| -------------------------------------- | ----------------------------------------------------------------------- |
| Permit `ReceiveWithAuthorization.to`   | `0xccc88a9d1b4ed6b0eaba998850414b24f1c315be`                            |
| Base `contracts.v3.approvalProxy`      | `0xccc88a9d1b4ed6b0eaba998850414b24f1c315be`                            |
| Base default `contracts.approvalProxy` | `0x5567954cd026cebfe486062cb75848e0f1c12e58`                            |
| Base default router                    | Matches `contracts.v3.2.erc20Router`                                    |
| Chain, token, account, amount          | Match the request (8453, Base USDC, synthetic account, 1,000,000 units) |

## Fix and evidence

SDK worktree: `/Users/jin/rainbow_studio/smart-contract-sdks/sdk-worktrees/relay-permit-contract-version`

Branch: `jin/relay-permit-contract-version`, based on the SHA above. Changes remain uncommitted.

`permitSupport.ts` selects `contracts.v3` when the quote protocol is v2; default quotes retain the default contract set. `prepare.ts` passes the sponsorship protocol into metadata selection. Missing or malformed versioned contracts are not replaced with a different version. All existing permit digest, amount, account, token, chain and target validation remains intact.

Patch: [relay-permit-contract-version.patch](./relay-permit-contract-version.patch). Apply to the SDK repository at the base above using `git apply --check` first.

Validation: 40 gateway test files / 638 tests passed; gateway TypeScript and changed-file ESLint passed. Regression tests failed before the fix. An additional diagnostic fed the actual captured quote through `readRelayPermit`: default contracts reproduce the exact source-mismatch error; version-selected contracts accept the same quote. Public evidence and test logs are in the private simulator runtime's `permit-mismatch-evidence` directory. No API key, user private key, signature, or transaction was used in that diagnostic.

## Remaining work

Revise and validate the contract-selection rule before deploying a gateway fix to the backend the app uses: `https://relay-reference-gateway-production.c-63c.workers.dev`. Current Wrangler access identifies Rainbow's `rainbowdotme.workers.dev` account; access to the `c-63c` account has not been established. Do not deploy to the similarly named worker in the wrong account.

After deployment, have the agent tap Buy BONK in the simulator and diagnose quote errors automatically. Stop at the mainnet Swap confirmation for the user. After the user submits, inspect execution status and balances; prepare BONK → Solana USDC and stop at its confirmation. A successful quote alone does not prove sponsored execution or receipt of tokens.
