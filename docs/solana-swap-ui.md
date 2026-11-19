# Solana in the normal swap sheet

Branch: `jin/solana-swap-ui`, based on `jin/solana-balances-v2` at `c7d58b45b`.

## Scope

Open the normal wallet Swap button and choose SOL, USDC on Solana, or BONK from the default output list. Owned supported Solana tokens also appear in the input list. Selecting one opts into a controller within the same swap screen; “Other networks” in a token selector returns to the existing EVM controller. The internal feature flag, non-store build, mainnet mode, and previously enabled mnemonic account are required. Developer test buttons remain available.

Supported routes are Base native ETH → SOL/USDC/BONK and every distinct pair among SOL, USDC, and BONK. Amounts are entered in token units. Base USDC inputs, Solana → EVM outputs, arbitrary token search, exact-output entry, fiat entry, configurable slippage, and zero-SOL source sponsorship are outside this slice. The quote's actual minimum output is shown before signing. Default SDK/provider slippage applies; the EVM settings are not passed through or represented as applying to these quotes.

## Integration boundaries

- `Swap.tsx` selects the controller only after a flagged, account-bound Solana selection. The existing EVM quote/RAP/gas controller retains its implementation. Account or flag changes unmount the new controller and invalidate its pending UI work.
- `SolanaSwapOptions.tsx` adds the three default options to the normal lists. It does not change the global EVM asset model, EVM `ChainId`, or wallet store. The fixed internal options remain available above EVM-filtered results and carry an explicit Solana network label. They are not added to EVM favorites/search backend requests.
- `SolanaSwapFlow.tsx` reuses the existing `SwapInput` cards, shared swap keyboard, press animations, and hold-to-activate controls. The controller now uses the shared `SwapSliderView` gestures and Max action, `SwapNumberPadView` keys, `SwapAssetFields` layout, `SwapActionButton` token selectors, `BalanceBadge`, and `SwapNavbarView`. EVM wrappers still feed these views from the existing EVM controller. Solana supplies exact decimal amounts and its separate execution controller. Token selectors and review/status content remain route-specific; configurable settings, fiat amount entry, favorites, and asset-detail behavior are not implemented for Solana. Shared card types now accept only the color properties the cards actually read; rendering is unchanged.
- `core/swap.ts` owns the small allowlist, exact amount parsing and quote validation. `data/swapTypes.ts` keeps wallet-bound prepared types out of the core layer. `swapSelection.ts` is transient and binds selections to both wallet identity and raw address.
- `mvpTrades.ts` adds variable-amount preparation and extends the existing executor. Dev buttons and normal UI share the persisted execution record, submission lock, single-use prepared-object guard, signer loaders, account checks, and `ManagedExecutionFailedError` handling.

## Safety and lifecycle

Base ETH balance is checked on chain before preparation and again after unlocking. Solana token balances are checked for the exact mint/owner. Solana Max retains a conservative 0.001 SOL buffer, and the signer queries the actual message fee before releasing its signature; this buffer is not a precise rent estimate. Before broader rollout, replace it with a complete fee/rent estimate. Full provider sponsorship remains mandatory; Base-source gasless execution stays required, while Solana sources pay their own network fees.

Input amounts use decimal strings and bigint base units, reject overprecision instead of silently rounding, and reject Solana amounts above the token u64 limit. Quotes must match the selected output mint/cluster/decimals, exact input, positive output/minimum, sponsorship, and expiry. Selection changes invalidate in-flight responses. Quotes refresh on the existing EVM 12-second cadence outside review. An expired review automatically acquires a fresh quote and requires review again; stale execution objects cannot be signed. The exact prepared object shown in review is signed once.

Pending and ambiguous executions block another swap across the developer menu and normal UI. A Solana failure before any signature leaves the signer releases the unsigned attempt; failures after a signature retain the execution ID. Status is polled while the sheet is open, and pending executions resume on re-entry. Confirmed status refreshes EVM and Solana balances. Execution IDs and explorer links remain in the developer harness; the normal flow does not expose that debug panel. This does not add Solana entries to the global transaction-history model or background notifications.

## Manual verification

1. In the existing Rainbow Solana MVP simulator, open **Swap**, then select BONK from the default output list. Choose Base ETH as input if it was not already selected. Enter a small token amount, inspect the quote, and tap Review.
2. Check exact spend, receive/minimum, Solana recipient and sponsorship disclosure. Let the quote expire; signing stays disabled while a new quote loads automatically, with no separate Refresh quote action.
3. Drag the percentage slider, tap Max, and edit using the shared keyboard. Percentages use the spendable balance (SOL retains 0.001 SOL) and floor to exact base units. Change the input to owned BONK and output to SOL or Solana USDC. Confirm the source-fee disclosure and verify amount entry/Max. A funded swap requires the user to hold the confirmation button.
4. Verify submitted/pending/terminal status and refreshed wallet balances after the user-run transaction. Close and reopen a pending swap; it must resume status rather than fund another execution.
5. Return through a token selector → Other networks and verify an EVM-only swap still uses the existing UI. Disable Solana or change accounts and verify stale selections cannot sign.

Live unsigned previews and review screens were exercised for 0.0005 Base ETH → BONK and 100,000 BONK → SOL during implementation. The provider rejected the smaller 10,000 BONK → SOL request with HTTP 400 (wrapped by the worker as HTTP 502); the response did not expose the precise reason. Failed preparation uses the existing No quote available warning and disables Review. Cancelling a token picker fetches a fresh quote, and Back was verified to restore the EVM screen. No funded transaction was signed by the agent. Automated coverage includes all nine supported pairs, amounts, balance/fee failures, account changes, sponsorship, expiry, uncertain submissions, existing developer routes, balances, keychain, and the EVM quote-controller lifecycle. Physical-device signing, Android UI, every pair's live settlement, and release-build validation remain unverified.

Validation: 160 tests across 16 suites passed; TypeScript, changed-file ESLint, dependency checks, and diff whitespace checks passed. Metro 8093 serves this uncommitted branch in the dedicated Rainbow Solana MVP simulator; source-map content matches the swap screen, Solana controller, and executor. No native dependencies or environment variables were added.

## Shared presentation revision

Solana entry remains gated by `useSolanaBalancesAddress`: remote `solana_enabled` or the `SOLANA` developer override, internal non-store build, mainnet mode, and an enabled account. Flag/account changes still unmount the Solana controller. There is no new feature flag or production EVM quote/signing path. Shared view extractions affect EVM rendering composition, but preserve the existing controls, callbacks, settings, and amount policies.

Removed the custom “You receive” label and generic keyboard. Both cards now use the normal two-row amount/fiat-value/balance presentation and token action buttons. Missing fiat prices display zero through the existing currency formatter. Amounts remain token-input-only; native-currency values are display-only. Percentage and Max calculations use bigint base units, retain the native SOL reserve, and never round above the spendable balance.

Revision checks: 142 focused tests across 11 suites include the existing EVM quote-controller lifecycle, feature/account gates, signing/execution regressions, and new keypad precision/percentage cases. TypeScript and dependency checks pass. This revision does not change signing, storage, or transaction submission.

Simulator revision verification: shared cards, Base icon/badge, balance formatting, percentage slider, and swap keyboard render; Base ETH → BONK produces a live unsigned quote. Four served modules match current source (private runtime shared-swap-controls-verification.json). Automated dragging did not reliably move the slider, so manual drag-to-amount synchronization remains pending; this is not recorded as a passing UI check. The screen is left open for that check. No funded transaction was submitted.

## November 18: remove custom loading/error UI

Removed the Solana-specific loading ellipsis, raw red error block, Refresh/Retry quote actions, expiry countdown, fee-buffer hint, execution ID/explorer panel and New swap action. Reused the existing swap spinner, shared warning presentation and localized Fetching prices/Review/Swapping/Done labels. The last numeric output remains visible while refreshing; the executable prepared quote is invalidated separately. Submission failures use the existing swap-error alert pattern. Pending-execution checks remain automatic. No route, signer, storage or developer-button changes.

The earlier reported Base ETH → SOL error was no longer visible on inspection; the screen had a successful unsigned quote. Its cause remains unconfirmed.

Final cleanup verification: TypeScript, changed-file ESLint and diff checks pass; the focused 142-test suite and dependency checks passed during this revision. The simulator displays a fresh unsigned 0.002382 Base ETH → SOL quote with the shared amount controls and Review action, without Refresh quote or a loading ellipsis. No transaction was submitted.

## November 18: quote failure recovery

The reported disabled Review followed a failed Base `eth_getBalance` request. The Solana controller only scheduled refreshes after successful quotes, so a transient failure left it disabled indefinitely. Failed preparations now clear the previous output and retry on the existing 12-second cadence; background balance refresh failures no longer invalidate a usable quote (submission still checks funds). Selecting the same amount again also requests a replacement quote.

Verified automatic failure recovery, background balance failure handling, and same-amount reselection in controller regression tests. The 56 focused controller/core/executor tests and TypeScript pass. In the dedicated simulator, a fresh Base ETH → SOL quote enabled Review and tapping it opened confirmation. No transaction was signed. Metro was restored on port 8093.

## User-paid source fee estimate

The normal swap review shows the estimated user-paid network fee. Solana-source preparation queries `getFeeForMessage` for the exact prepared message (base and priority fee), before the quote becomes reviewable. Missing/expired-message estimates and RPC failures do not become zero fees. Each replacement quote gets its own estimate; the signer still rechecks fees and balance before signing. Required gasless Base routes show zero user-paid network fees.

The preview SDK's Relay service wrapper retains at most eight unsigned prepared messages, keyed by execution ID and consumed after preparation; it returns the original SDK response unchanged. This temporary boundary avoids changing the SDK's opaque prepared objects or production SDK. No signer is accessed during estimation.

The fee uses the selected-currency SOL valuation from the same account's balances when available, with the existing EVM small-fee formatting; otherwise it displays the exact SOL amount. The row is read-only. Provider sponsorship remains required, including provider-quoted rent; this does not implement selective rent sponsorship. `getFeeForMessage` covers network fees, not account-creation transfers, deposits or tips. A future unsponsored provider route must expose those additional user-paid costs before presenting an all-inclusive fee. The SDK's sponsored subtotal is not used for this display.

## Shared footer presentation

The Solana footer now uses `SwapActionButton` for Review, Hold to Swap, and pending/completed states, including the existing sizing, output-token color, icons, and hold animation. The hold animation receives the same asset as the button instead of reading the EVM output selection. EVM callers still provide their existing asset and handlers.

The user-paid fee is visible beside the action button before Review through the shared gas layout and icon. It stays read-only, with no gas-speed selector or custom-gas controls; the detailed review retains the fee row. Quote preparation, fee calculations, and signing remain unchanged. Focused tests cover the fee before review, Review without submission, and submission only through the hold callback. Simulator interaction remains unverified; no transaction was submitted.

Fully sponsored, gasless quotes now reuse the EVM Free label and crossed-out fee styling. Until the SDK exposes a pre-sponsorship network-gas estimate, the crossed-out value uses the existing `--` placeholder; the provider fee subtotal is not substituted for network gas. Solana-source quotes retain their user-paid network fee even when provider fees are fully sponsored.
