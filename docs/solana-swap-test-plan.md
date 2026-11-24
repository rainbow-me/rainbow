# Solana swap test matrix — November 20, 2026

**Planning only: every case below is Not run for this checkpoint.** Historical tests are recorded in the preserved [MVP notes](https://github.com/rainbow-me/rainbow/blob/01b8d6e6d/docs/solana-internal-mvp.md) and [swap UI notes](https://github.com/rainbow-me/rainbow/blob/01b8d6e6d/docs/solana-swap-ui.md); this checklist does not upgrade those results to current passes. No transactions were signed or submitted to create this plan.

Use [solana-swap-test-results.csv](solana-swap-test-results.csv) to record evidence. Test the published `jin/solana-review-5-swap-flow` branch. Record the exact tested commit. The normal sheet supports **nine distinct pairs**: Base ETH plus three Solana assets as inputs, with SOL/USDC/BONK as outputs excluding identity swaps.

## Setup (5 minutes after a native build)

1. Build `jin/solana-review-5-swap-flow` in a dedicated simulator with a free Metro port. Verify Metro’s working directory, the app’s bundle URL, and the exact Git commit before testing. The existing **Rainbow Solana MVP / Metro 8093** session still runs the preserved old stack; it is not evidence for this new stack. Do not interrupt other simulator sessions.
2. Use a mainnet build with Solana enabled through the existing feature configuration, then enable the selected mnemonic subaccount. Store builds use remote `solana_enabled`; internal builds can also use the local Solana override. Record its EVM and Solana addresses. Private-key-only/watch-only/hardware sources are outside this MVP.
3. Check source balances before each case. Fund SOL before Solana-source swaps; the normal-sheet guard retains **0.001 SOL**. A sponsored destination or SOL output does not pay the source wallet's gas automatically.
4. Review a fresh quote first. Suggested small amounts are test inputs, not a guarantee of provider minimums or balance availability. Normal UI enters token units; use the displayed ETH price to choose approximately $1 of ETH. The duplicate developer buy buttons have been removed.
5. The user confirms any mainnet spend. Save the reviewed amount/minimum, execution ID, source and destination receipts, and before/after balances. A quote or PENDING status alone is not a pass.

## Route cases

| ID | Source → destination | Entry | Suggested input | Expected fee | Main check |
| --- | --- | --- | --- | --- | --- |
| S01 | Base ETH → SOL | Normal swap sheet | About $1 of ETH, entered in ETH units | Gasless + full provider sponsorship; Free | Bootstrap SOL for later source fees; verify the paired Solana address receives native SOL. |
| S02 | Base ETH → Solana USDC | Normal swap sheet | About $1 of ETH, entered in ETH units | Gasless + full provider sponsorship; Free | Verify mainnet USDC mint/6 decimals; recipient token account may be created. |
| S03 | Base ETH → BONK | Normal swap sheet | About $1 of ETH, entered in ETH units | Gasless + full provider sponsorship; Free | Verify BONK mint/5 decimals and automatic wallet-row balance refresh. |
| S04 | SOL → Solana USDC | Normal swap sheet | 0.005 SOL if funded, retaining >=0.001 SOL reserve | User pays source network fee in SOL; provider fees required sponsored | Verify SOL spend plus actual fee, USDC output and minimum received. |
| S05 | SOL → BONK | Normal swap sheet | 0.005 SOL if funded, retaining >=0.001 SOL reserve | User pays source network fee in SOL; provider fees required sponsored | Compare first-time BONK token-account creation with an already-owned BONK account. |
| S06 | Solana USDC → SOL | Normal swap sheet | 0.25 USDC if available and quoted | User pays source network fee in SOL; provider fees required sponsored | Verify native SOL output; received SOL does not remove the need for source SOL up front. |
| S07 | Solana USDC → BONK | Normal swap sheet | 0.25 USDC if available and quoted | User pays source network fee in SOL; provider fees required sponsored | Token-to-token path: input token debit, output token credit, separate SOL fee. |
| S08 | BONK → SOL | Normal swap sheet | 100,000 BONK if available and quoted | User pays source network fee in SOL; provider fees required sponsored | Historical 10,000 BONK preview failed; record a minimum-size rejection rather than silently increasing spend. |
| S09 | BONK → Solana USDC | Normal swap sheet | 100,000 BONK if available and quoted | User pays source network fee in SOL; provider fees required sponsored | Exercise token-to-token return path and disappearance of a fully spent token row. |
| S10 | SOL → Base USDC | Developer Settings button | Fixed 0.01 SOL plus source fee | User pays source network fee in SOL; provider fees required sponsored | Not selectable in normal sheet yet; verify Base USDC credit to the paired EVM address and both-chain receipts. |

Run S01 first to establish SOL, then S02–S03 to establish token balances. Run S04–S09 while retaining enough SOL for subsequent fees. S10 needs at least its fixed 0.01 SOL input plus gas; replenish before running if needed. The normal sheet's BONK amount is user-entered; the duplicate developer BONK sell button has been removed.

## Five checks for each route

1. **Quote/review:** correct chain, token/mint, exact input, minimum output and paired recipient; Review stays disabled until a usable quote exists.
2. **Fees/presentation:** Base gasless routes show **Free** with crossed-out `--` (original network gas unavailable), not a claimed $0 original fee. Solana-source routes show user-paid fee, fiat or exact SOL fallback; no editable gas interface. Provider sponsorship alone must not produce Free.
3. **Authorization:** Review does not sign. Hold/authentication submits once. Cancelling authentication does not spend; if submission is uncertain, retain its execution ID and check status before another attempt.
4. **Settlement:** verify source debit, destination credit >= reviewed minimum, correct addresses/mints and actual receipt fees. For cross-chain routes inspect both chains. Do not assume the source receipt proves destination delivery.
5. **Balances:** wallet rows and total refresh after confirmation; pull-to-refresh agrees with receipts. Missing prices may display zero, but token quantity must remain correct. Distinguish a token account from the owner's native account.

Gas RPC estimates cover network fees, not arbitrary account-creation transfers. Provider-side rent/route sponsorship remains required under this MVP. Record rent/account changes separately when checking actual balance deltas; do not infer the sponsor's complete cost from the crossed-out placeholder.

## Five regression batches (unsigned first; about 5–10 minutes each)

| Batch | Scenarios | Expected result |
| --- | --- | --- |
| Amount entry and layout | Zero, smallest valid unit, excess decimals, >balance, 25/50/75/Max; change amount repeatedly while Fetching; native/SPL sources; light/dark | No rounding above balance; SOL reserve retained; Fetching centered; main button and fee both fit; no missing translations; newest amount owns the quote. |
| Quote lifecycle | Let a quote expire, change input/output, cancel picker, select the same amount again, interrupt network during preparation and recover | Fresh quote/ID; stale quote cannot sign; recovery without a custom refresh button; no infinite Fetching due to a stale request. |
| Account and feature gates | Switch mnemonic subaccount during prepare/review/auth; turn flag off; damaged/watch-only/private-key-only source; verify store builds with remote `solana_enabled` on and off | Stale selection unmounts/blocks signing; no wrong-account holdings or signer reuse. |
| Submission and resume | Cancel before signing, double tap/hold, close/reopen while pending, connectivity loss around submission | One execution; ambiguity retains ID; pending resumes status; only confirmed state refreshes settled balances; no blind second spend. Use deterministic tests for dangerous fault timing where practical. |
| EVM regression | Flag off and flag on with EVM-only pair; token selection/search/favorites/info; native/token amount input, slider, keyboard, gas settings, Review/Hold | Existing EVM presentation and behavior remain intact. Shared component extraction affects this path even when Solana is disabled. |

## Deferred or unavailable in the normal sheet

| Route / capability | Current reason |
| --- | --- |
| Base USDC → SOL / BONK / Solana USDC | Normal-sheet source list only adds Base ETH. Earlier Relay approval-proxy incompatibility needs a fresh backend check; no claim it is still unresolved today. Do not treat this as a currently available button. |
| Solana → arbitrary EVM outputs | SDK supports Solana → EVM, but normal-sheet output picker is still SOL/USDC/BONK only. S10 is the existing developer route. |
| Fully gasless Solana source | Current integration requires the source wallet to pay SOL gas; provider full sponsorship is distinct. Requires SDK/worker fee-payer support. |
| User-paid rent with sponsored network/provider fees | Current SDK policy is full provider sponsorship, not the desired separately configurable rent policy. |
| General token search and full token actions | Hardcoded default list; favorites/native SOL info and expanded sheets remain incomplete. Not settlement failures. |

**Next two-minute action:** open the results CSV and choose S01 (Base ETH → SOL) as the first new run after code review. Do not execute now if you are taking a break.

## Reorganized stack

The new review stack preserves network artwork and the November 20 developer-button cleanup. Existing simulator sessions were not restarted.

## Shared balance-row editing (unsigned, 2 minutes)

1. With Solana enabled and SOL/USDC/BONK holdings visible, enter the wallet token list's Edit mode. Confirm Solana rows remain visible with the same selection controls as EVM.
2. Pin a Solana token and an EVM token together; finish editing and verify both move above unpinned tokens. Unpin and verify normal value ordering returns.
3. Hide a Solana token; verify it disappears outside Edit, reappears inside Edit, and can be unhidden. Repeat with a mixed EVM/Solana selection.
4. Switch accounts and restart the app; verify preferences remain scoped to the paired EVM account and survive reload. Turn the Solana flag off and confirm EVM editing still works.
5. Check icons and values in light/dark mode. EVM row taps must still open their expanded sheet. Solana row taps outside Edit remain inactive; expanded-sheet integration is not part of this change.

Status: Not run in the simulator for the shared-row change. Unit coverage checks selection callbacks, ID casing, persistence, row filtering, icon fallback and EVM navigation.
