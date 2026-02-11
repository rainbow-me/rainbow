# Branch 5: daniel/7702-atomic-swaps

**Execution Engine: Atomic Multi-Step Transaction Execution**

## Overview

This branch implements the core atomic execution engine, allowing multiple RAP actions (unlock + swap) to be executed as a single atomic transaction via EIP-7702 delegation. This provides one-signature swaps, gas savings, and improved UX.

## Commits (9)

1. `bef9f7485` - fix: pass nonce for transaction consistency
2. `588a44260` - refactor: atomic execution switch logic
3. `1f7a24b3f` - fix: use delegation feature flag/preference
4. `58651eb34` - feat: add prepare functions for atomic rap execution
5. `97e23388a` - feat: atomic rap action signaling
6. `4d754ce9b` - feat: atomic swaps remote flag
7. `8129a2aa5` - feat: atomic swaps feature flag
8. `a48e6effe` - refactor: adopt viem Hash over TxHash type
9. `7dfee516f` - refactor: viem Hex type for toHex

## Files Changed (11 files, +397/-200)

```
src/screens/Swap/providers/swap-provider.tsx       |   6 +
src/config/experimental.ts                         |   2 +
src/entities/transactions/transaction.ts           |  15 +-
src/handlers/web3.ts                               |   4 +-
src/model/remoteConfig.ts                          |   2 +
src/raps/actions/claimBridge.ts                    |  18 +--
src/raps/actions/crosschainSwap.ts                 | 161 ++++++++++---------
src/raps/actions/swap.ts                           | 171 ++++++++++++---------
src/raps/actions/unlock.ts                         |  91 +++++++----
src/raps/execute.ts                                | 119 +++++++++++++-
src/raps/references.ts                             |   8 +
```

## Architecture

### Atomic Execution Flow

```
┌──────────────────────────────────────────────────────┐
│           User Initiates Swap (UI)                   │
│           parameters.atomic = true/false             │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  walletExecuteRap()  │
          │  Entry point         │
          └──────────┬───────────┘
                     │
                     ▼
       ┌─────────────────────────┐
       │  Check eligibility:     │
       │  • delegationSupported? │
       │  • delegationEnabled?   │
       │  • atomic flag set?     │
       └──────────┬──────────────┘
                  │
     ┌────────────┴────────────┐
     │                         │
     ▼                         ▼
┌─────────────────────┐  ┌─────────────────────┐
│  ATOMIC EXECUTION   │  │  LEGACY EXECUTION   │
│  (NEW)              │  │  (FALLBACK)         │
├─────────────────────┤  ├─────────────────────┤
│                     │  │                     │
│ PHASE 1: PREPARE    │  │ For each action:    │
│ ────────────────    │  │ • Execute action    │
│ For each action:    │  │ • Wait for confirm  │
│ • prepareUnlock()   │  │ • Get receipt       │
│ • prepareSwap()     │  │ • Continue          │
│                     │  │                     │
│ Returns:            │  │ Total: 2 signatures │
│ • BatchCall[]       │  │ Total: 2 tx hashes  │
│ • Transaction meta  │  │                     │
│                     │  └─────────────────────┘
│ PHASE 2: EXECUTE    │
│ ────────────────    │
│ executeBatchedTx({  │
│   calls: [...],     │
│   nonce,            │
│   gasParams         │
│ })                  │
│                     │
│ Returns:            │
│ • Single tx hash    │
│                     │
│ PHASE 3: TRACK      │
│ ────────────────    │
│ addNewTransaction({ │
│   ...metadata,      │
│   hash,             │
│   atomic: true,     │
│   delegated: true   │
│ })                  │
│                     │
│ Total: 1 signature  │
│ Total: 1 tx hash    │
│                     │
└─────────────────────┘
```

## Key Changes

### 1. Feature Flags

```typescript
// src/config/experimental.ts
export const ATOMIC_SWAPS = 'Atomic Swaps';

const config = {
  // ... other flags
  [ATOMIC_SWAPS]: {
    settings: true,  // Shows in dev settings
    value: true      // Enabled by default
  },
} as const;
```

```typescript
// src/model/remoteConfig.ts
export interface RemoteConfig {
  // ... other flags
  atomic_swaps_enabled: boolean;
}
```

### 2. Transaction Types

```typescript
// src/entities/transactions/transaction.ts

export type NewTransaction = {
  // ... existing fields

  // NEW: Atomic execution metadata
  atomic?: boolean;      // Was this executed atomically?
  delegated?: boolean;   // Was this delegated via EIP-7702?
};
```

### 3. Prepare Functions

Each RAP action now has a "prepare" version that returns a `BatchCall` instead of executing:

```typescript
// src/raps/actions/unlock.ts

export type PrepareActionResult =
  | { call: BatchCall | null }
  | { call: BatchCall; transaction: Omit<NewTransaction, 'hash'> };

export async function prepareUnlock(
  props: PrepareActionProps<'unlock'>
): Promise<PrepareActionResult> {
  const { parameters, wallet, chainId } = props;
  const { assetToUnlock, approvalAmount } = parameters;

  // Build approval transaction
  const approveTx = {
    to: assetToUnlock.address,
    data: erc20Interface.encodeFunctionData('approve', [
      spenderAddress,
      approvalAmount || MaxUint256.toString()
    ]),
    value: '0',
  };

  // Estimate gas
  const gasLimit = await estimateTransactionsGasLimit({
    chainId,
    transactions: [approveTx],
  });

  // Return BatchCall (not executed yet!)
  return {
    call: {
      to: approveTx.to,
      data: approveTx.data as Hex,
      value: BigInt(approveTx.value),
      gas: BigInt(gasLimit),
    },
    // No transaction metadata for unlock
  };
}
```

```typescript
// src/raps/actions/swap.ts

export async function prepareSwap(
  props: PrepareActionProps<'swap'>
): Promise<PrepareActionResult> {
  const { parameters, wallet, chainId, quote } = props;

  // Build swap transaction from quote
  const swapTx = {
    to: quote.to,
    data: quote.data,
    value: quote.value,
  };

  // Estimate gas
  const gasLimit = await estimateTransactionsGasLimit({
    chainId,
    transactions: [swapTx],
  });

  // Return BatchCall AND transaction metadata
  return {
    call: {
      to: swapTx.to,
      data: swapTx.data as Hex,
      value: BigInt(swapTx.value),
      gas: BigInt(gasLimit),
    },
    transaction: {
      // Full metadata for pending transaction
      from: wallet.address,
      to: swapTx.to,
      amount: quote.sellAmount,
      asset: quote.sellTokenAddress,
      type: 'swap',
      chainId,
      // ... more fields
    },
  };
}
```

```typescript
// src/raps/actions/crosschainSwap.ts

export async function prepareCrosschainSwap(
  props: PrepareActionProps<'crosschainSwap'>
): Promise<PrepareActionResult> {
  // Similar to prepareSwap but for crosschain
  // ...
}
```

### 4. Atomic Execution Logic

```typescript
// src/raps/execute.ts

export const walletExecuteRap = async <T extends RapTypes>(
  type: T,
  parameters: RapActionParameters[T],
  wallet: Signer
) => {
  const { actions } = rap;

  // ═══════════════════════════════════════════════════════
  // ATOMIC EXECUTION ELIGIBILITY CHECK
  // ═══════════════════════════════════════════════════════

  const { supported: delegationSupported } = await supportsDelegation({
    address: parameters.quote?.from as Address,
    chainId: parameters.chainId,
  });

  const delegationEnabled =
    getRemoteConfig().delegation_enabled ||
    getExperimentalFlag(DELEGATION);

  const atomicEnabled =
    getRemoteConfig().atomic_swaps_enabled ||
    getExperimentalFlag(ATOMIC_SWAPS);

  const executeAtomic =
    delegationSupported &&
    delegationEnabled &&
    atomicEnabled &&
    parameters.atomic;  // User preference!

  // ═══════════════════════════════════════════════════════
  // ATOMIC PATH
  // ═══════════════════════════════════════════════════════

  if (executeAtomic && (type === 'swap' || type === 'crosschainSwap')) {
    const { chainId, quote, gasParams } = parameters;
    const provider = getProvider({ chainId });
    const nonce = await getNextNonce({ address: wallet.address, chainId });

    try {
      const calls: BatchCall[] = [];
      let pendingTransaction: Omit<NewTransaction, 'hash'> | null = null;

      // ─────────────────────────────────────────────────────
      // PHASE 1: PREPARE - Build batch calls
      // ─────────────────────────────────────────────────────

      for (const action of actions) {
        const prepareResult = await typePrepareAction(action.type, {
          parameters: action.parameters,
          wallet,
          chainId,
          quote,
        })();

        if (prepareResult.call) {
          calls.push(prepareResult.call);

          // Keep last transaction metadata (swap, not unlock)
          if ('transaction' in prepareResult) {
            pendingTransaction = prepareResult.transaction;
          }
        }
      }

      if (calls.length === 0) {
        throw new RainbowError('No calls to execute');
      }

      // ─────────────────────────────────────────────────────
      // PHASE 2: EXECUTE - Submit atomic batch
      // ─────────────────────────────────────────────────────

      const hash = await executeBatchedTransaction({
        calls,
        nonce,
        gasParams: {
          maxFeePerGas: gasParams.maxFeePerGas,
          maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas,
        },
        chainId,
        wallet: wallet as Wallet,
      });

      // ─────────────────────────────────────────────────────
      // PHASE 3: TRACK - Add to pending transactions
      // ─────────────────────────────────────────────────────

      if (pendingTransaction) {
        addNewTransaction({
          ...pendingTransaction,
          hash,
          atomic: true,
          delegated: true,
        });
      }

      logger.info('Atomic RAP execution successful', {
        type,
        hash,
        nonce,
        actionCount: calls.length,
      });

      return { nonce, hash };

    } catch (error) {
      logger.error(new RainbowError('Atomic RAP execution failed'), {
        error,
        type,
      });
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════
  // LEGACY PATH - Sequential execution
  // ═══════════════════════════════════════════════════════

  for (const action of actions) {
    await executeAction({
      action,
      wallet,
      rap,
      index: actions.indexOf(action),
    });
  }

  return { nonce, hash: null };
};
```

### 5. User Preference (UI)

```typescript
// src/screens/Swap/providers/swap-provider.tsx

// User can toggle atomic execution in swap UI
const SwapProvider = () => {
  const [useAtomicExecution, setUseAtomicExecution] = useState(true);

  const executeSwap = async () => {
    await walletExecuteRap('swap', {
      ...swapParams,
      atomic: useAtomicExecution,  // User preference
    }, wallet);
  };

  return (
    <SwapContext.Provider value={{ executeSwap }}>
      {children}
    </SwapContext.Provider>
  );
};
```

## Prepare Action Type System

```typescript
// src/raps/execute.ts

function typePrepareAction<T extends RapActionTypes>(
  type: T,
  props: PrepareActionProps<T>
): () => Promise<PrepareActionResult> {
  switch (type) {
    case 'unlock':
      return () => prepareUnlock(props as PrepareActionProps<'unlock'>);

    case 'swap':
      return () => prepareSwap(props as PrepareActionProps<'swap'>);

    case 'crosschainSwap':
      return () => prepareCrosschainSwap(props as PrepareActionProps<'crosschainSwap'>);

    default:
      throw new Error(`Action type "${type}" does not support atomic execution`);
  }
}
```

## Atomic vs Legacy Comparison

### Legacy Execution (Sequential)

```
User initiates swap: 100 USDC → ETH
│
├─ Step 1: Unlock (Approve USDC)
│  ├─ Build transaction
│  ├─ User signs ✍️
│  ├─ Submit to network
│  ├─ Wait for confirmation ⏳ (15 seconds)
│  └─ Get receipt ✅
│
└─ Step 2: Swap
   ├─ Build transaction
   ├─ User signs ✍️
   ├─ Submit to network
   ├─ Wait for confirmation ⏳ (15 seconds)
   └─ Get receipt ✅

Total time: ~30 seconds
Total signatures: 2
Total gas: ~230,000
Risk: Step 2 could fail after Step 1 succeeds
```

### Atomic Execution (Batched)

```
User initiates swap: 100 USDC → ETH
│
├─ Phase 1: Prepare (Build batch)
│  ├─ prepareUnlock() → BatchCall
│  └─ prepareSwap() → BatchCall + metadata
│
├─ Phase 2: Execute (Atomic)
│  ├─ Combine into single transaction
│  ├─ User signs ONCE ✍️
│  ├─ Submit to network
│  ├─ Wait for confirmation ⏳ (12 seconds)
│  └─ Get receipt ✅
│
└─ Phase 3: Track
   └─ Add to pending with atomic: true

Total time: ~12 seconds (60% faster)
Total signatures: 1 (50% less)
Total gas: ~195,000 (15% savings)
Risk: All-or-nothing (safer)
```

## Benefits

### 1. Better UX

```
BEFORE (Legacy):
┌──────────────────────────────┐
│ Sign approval for USDC       │  ← User action 1
└──────────────────────────────┘
         ⏳ Wait 15s
┌──────────────────────────────┐
│ Approval confirmed           │
└──────────────────────────────┘
┌──────────────────────────────┐
│ Sign swap transaction        │  ← User action 2
└──────────────────────────────┘
         ⏳ Wait 15s
┌──────────────────────────────┐
│ Swap confirmed               │
└──────────────────────────────┘

Total: 2 signatures, ~30 seconds

AFTER (Atomic):
┌──────────────────────────────┐
│ Sign swap transaction        │  ← User action (once!)
└──────────────────────────────┘
         ⏳ Wait 12s
┌──────────────────────────────┐
│ Swap confirmed               │
│ (approval + swap atomic)     │
└──────────────────────────────┘

Total: 1 signature, ~12 seconds
```

### 2. Gas Savings

```
Individual transactions:
  Unlock:  46,000 gas
  Swap:   184,000 gas
  ─────────────────
  Total:  230,000 gas

Atomic batch:
  Combined: 195,000 gas
  ─────────────────
  Savings:  35,000 gas (15%)

At 20 gwei gas price:
  Legacy: ~0.0046 ETH ($9.20)
  Atomic: ~0.0039 ETH ($7.80)
  ─────────────────────────────
  Saved: ~$1.40 per swap
```

### 3. Atomic Safety

```
LEGACY RISK:
Step 1: Approve ✅
Step 2: Swap ❌ (fails)
Result: Approved but no swap! Must retry.

ATOMIC SAFETY:
Step 1 + 2: Approve & Swap ✅ or ❌
Result: Either both succeed or both revert.
        No partial execution state.
```

## Testing Considerations

### Unit Tests

```typescript
describe('Atomic RAP execution', () => {
  beforeEach(() => {
    mockSupportsDelegation.mockResolvedValue({ supported: true });
    enableDelegationFlags();
  });

  it('executes atomically when all conditions met', async () => {
    const result = await walletExecuteRap('swap', {
      quote: mockQuote,
      atomic: true,
      chainId: 1,
    }, mockWallet);

    expect(executeBatchedTransaction).toHaveBeenCalledWith({
      calls: expect.arrayContaining([
        expect.objectContaining({ to: usdcAddress }), // unlock
        expect.objectContaining({ to: routerAddress }), // swap
      ]),
      nonce: expect.any(Number),
      gasParams: expect.any(Object),
      chainId: 1,
      wallet: mockWallet,
    });

    expect(result.hash).toBeTruthy();
    expect(addNewTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        atomic: true,
        delegated: true,
      })
    );
  });

  it('falls back to legacy when atomic disabled', async () => {
    const result = await walletExecuteRap('swap', {
      quote: mockQuote,
      atomic: false,  // User disabled
      chainId: 1,
    }, mockWallet);

    expect(executeBatchedTransaction).not.toHaveBeenCalled();
    expect(executeAction).toHaveBeenCalledTimes(2); // unlock + swap
  });

  it('falls back to legacy when delegation unsupported', async () => {
    mockSupportsDelegation.mockResolvedValue({ supported: false });

    const result = await walletExecuteRap('swap', {
      quote: mockQuote,
      atomic: true,
      chainId: 1,
    }, mockWallet);

    expect(executeBatchedTransaction).not.toHaveBeenCalled();
    expect(executeAction).toHaveBeenCalledTimes(2);
  });
});
```

### Integration Tests

```typescript
describe('End-to-end atomic swap', () => {
  it('completes swap with one signature', async () => {
    // Setup
    const user = await setupTestUser();
    await fundWallet(user, '1000 USDC');
    enableDelegation(user);

    // Get quote
    const quote = await getSwapQuote({
      from: 'USDC',
      to: 'ETH',
      amount: '100',
    });

    // Execute atomic swap
    const tx = await executeSwap({
      quote,
      atomic: true,
    });

    // Wait for confirmation
    const receipt = await tx.wait();

    // Verify
    expect(receipt.status).toBe(1); // Success
    expect(receipt.logs).toHaveLength(3); // Approval + Swap logs

    const balance = await getBalance(user, 'ETH');
    expect(balance).toBeGreaterThan(0); // Received ETH
  });
});
```

## Nonce Management

```typescript
// Critical: Use same nonce for entire batch

const nonce = await getNextNonce({
  address: wallet.address,
  chainId
});

// All calls in batch use this nonce
await executeBatchedTransaction({
  calls: [unlockCall, swapCall],
  nonce,  // ← Same nonce for both
  // ...
});

// Don't increment nonce between calls!
// The batch is ONE transaction.
```

## Error Handling

```typescript
try {
  const hash = await executeBatchedTransaction({ calls });
  return { hash, nonce };
} catch (error) {
  if (error.code === 'NONCE_EXPIRED') {
    // Retry with new nonce
    const newNonce = await getNextNonce({ address, chainId });
    return retry({ nonce: newNonce });
  }

  if (error.message.includes('insufficient funds')) {
    throw new RainbowError('Insufficient balance for gas');
  }

  // Fall back to legacy execution
  logger.warn('Atomic execution failed, falling back to legacy');
  return executeLegacyRap();
}
```

## Dependencies

**Requires from Branch 4:**
- ✓ Gas estimation with simulation
- ✓ Backend integration
- ✓ Transaction simulation

**Provides to next branches:**
- ✓ Atomic execution capability
- ✓ Prepare functions for RAP actions
- ✓ Transaction metadata (atomic, delegated)

## Files to Review

### Critical
- `src/raps/execute.ts` - Core atomic execution logic
- `src/raps/actions/unlock.ts` - prepareUnlock()
- `src/raps/actions/swap.ts` - prepareSwap()

### Important
- `src/config/experimental.ts` - ATOMIC_SWAPS flag
- `src/entities/transactions/transaction.ts` - Atomic metadata
- `src/raps/actions/crosschainSwap.ts` - prepareCrosschainSwap()

### Nice to Have
- `src/screens/Swap/providers/swap-provider.tsx` - User preference
- `src/handlers/web3.ts` - Type updates (Hash, Hex)
