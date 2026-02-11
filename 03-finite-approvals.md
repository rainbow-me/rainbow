# Branch 3: daniel/7702-finite-approvals

**Security Enhancement: Limit Token Approvals to Exact Amounts**

## Overview

This branch implements finite token approvals based on the swap quote's exact amount, replacing the previous pattern of infinite (MAX_UINT256) approvals. This significantly enhances security by limiting the approved amount to exactly what's needed for each transaction.

## Commits (2)

1. `57b394335` - fix: delegation flag dependent finite approvals
2. `0c49e780a` - feat: limit approvals based on approvalAmount quote gating

## Files Changed (13 files, +70/-165)

```
src/screens/Swap/hooks/useSwapEstimatedGasLimit.ts |  4 --
src/entities/transactions/transaction.ts           |  2 +-
src/raps/actions/crosschainSwap.ts                 | 23 ++-----
src/raps/actions/index.ts                          |  2 +-
src/raps/actions/swap.ts                           | 27 ++------
src/raps/actions/unlock.ts                         | 72 ++++++++++++----------
src/raps/claimClaimable.ts                         | 18 +-----
src/raps/references.ts                             |  1 +
src/raps/unlockAndCrosschainSwap.ts                | 29 +--------
src/raps/unlockAndSwap.ts                          | 19 +-----
src/raps/utils.ts                                  |  6 +-
src/screens/claimables/transaction/estimateGas.ts  | 28 +++------
src/systems/funding/stores/createDepositGasStores.ts | 4 --
```

## Architecture

### Before: Infinite Approvals (Insecure)

```
┌───────────────────────────────────────────────┐
│           User wants to swap 100 USDC         │
└─────────────────────┬─────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  unlock() RAP Action   │
         ├────────────────────────┤
         │  Approve: MAX_UINT256  │  ⚠️ SECURITY RISK
         │  (~infinite tokens)    │     Contract can now
         └────────┬───────────────┘     spend unlimited USDC
                  │
                  ▼
         ┌────────────────────────┐
         │  swap() RAP Action     │
         ├────────────────────────┤
         │  Uses: 100 USDC only   │
         └────────────────────────┘

❌ Problem: Contract approved for unlimited amount
❌ Risk: If contract is compromised, all tokens at risk
❌ UX: Users don't know they approved unlimited spending
```

### After: Finite Approvals (Secure)

```
┌───────────────────────────────────────────────┐
│           User wants to swap 100 USDC         │
└─────────────────────┬─────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  Quote provides:       │
         │  approvalAmount: 100   │
         └────────┬───────────────┘
                  │
                  ▼
         ┌────────────────────────┐
         │  unlock() RAP Action   │
         ├────────────────────────┤
         │  Approve: 100 USDC     │  ✅ SECURE
         │  (exact amount)        │     Contract can only
         └────────┬───────────────┘     spend 100 USDC
                  │
                  ▼
         ┌────────────────────────┐
         │  swap() RAP Action     │
         ├────────────────────────┤
         │  Uses: 100 USDC        │
         └────────────────────────┘

✅ Benefit: Minimal approval required
✅ Security: Limited exposure if contract compromised
✅ UX: Clear approval amounts shown to user
```

## Key Changes

### 1. Unlock Action - Core Change

```typescript
// src/raps/actions/unlock.ts

// BEFORE: Always approve MAX_UINT256
export const unlock = async (parameters: UnlockActionParameters) => {
  const { assetToUnlock } = parameters;

  const approvalAmount = MaxUint256.toString(); // ⚠️ Infinite approval

  const approveTxPayload = {
    to: assetToUnlock.address,
    data: erc20Interface.encodeFunctionData('approve', [
      contractAddress,
      approvalAmount
    ]),
  };
  // ...
};

// AFTER: Use exact amount from quote
export const unlock = async (parameters: UnlockActionParameters) => {
  const { assetToUnlock, approvalAmount: quoteApprovalAmount } = parameters;

  // Use quote's approval amount if available, otherwise fall back to infinite
  const approvalAmount = quoteApprovalAmount
    ? quoteApprovalAmount.toString()
    : MaxUint256.toString();

  const approveTxPayload = {
    to: assetToUnlock.address,
    data: erc20Interface.encodeFunctionData('approve', [
      contractAddress,
      approvalAmount  // ✓ Exact amount
    ]),
  };
  // ...
};
```

### 2. Quote Interface Update

```typescript
// src/entities/transactions/transaction.ts

export interface Quote {
  sellAmount: string;
  buyAmount: string;
  sellTokenAddress: AddressOrEth;
  buyTokenAddress: AddressOrEth;

  // NEW: Exact amount needed for approval
+ approvalAmount?: string;

  // ... other fields
}
```

### 3. Swap Action Simplification

```typescript
// src/raps/actions/swap.ts

// BEFORE: Calculate approval amount in swap action
export const swap = async (parameters: SwapActionParameters) => {
  // ... lots of approval calculation logic
  const approvalAmount = calculateApprovalAmount(quote);
  // ... more code
};

// AFTER: Approval amount comes from quote
export const swap = async (parameters: SwapActionParameters) => {
  // No approval calculation needed!
  // The quote already includes approvalAmount
  // unlock() action will use it
};
```

### 4. Crosschain Swap Simplification

```typescript
// src/raps/actions/crosschainSwap.ts

// BEFORE: 23 lines of approval amount calculation
export const crosschainSwap = async (parameters: CrosschainSwapActionParameters) => {
  let approvalAmount: string;

  if (needsApproval) {
    // Calculate approval amount...
    // Check slippage...
    // Adjust for decimals...
    // etc...
  }
  // ...
};

// AFTER: Trust the quote
export const crosschainSwap = async (parameters: CrosschainSwapActionParameters) => {
  // Quote includes approvalAmount
  // No calculation needed
  // unlock() will handle it
};
```

## Data Flow

```
┌──────────────────────────────────────────────────────┐
│                 Get Swap Quote                       │
│              (Backend API / 0x API)                  │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Quote Response      │
          ├──────────────────────┤
          │  sellAmount: "100"   │
          │  buyAmount: "99.5"   │
          │  approvalAmount:     │
          │    "100" (NEW)       │
          └──────┬───────────────┘
                 │
                 ▼
     ┌───────────────────────────┐
     │  createUnlockAndSwapRap() │
     └───────┬───────────────────┘
             │
             ├─ Action 1: unlock
             │  ├─ assetToUnlock: USDC
             │  └─ approvalAmount: "100" ← From quote
             │
             └─ Action 2: swap
                └─ quote: {...}

                ▼
     ┌───────────────────────────┐
     │  Execute RAP Actions      │
     └───────┬───────────────────┘
             │
             ├─ unlock() executes
             │  └─ Approves exactly 100 USDC ✅
             │
             └─ swap() executes
                └─ Uses 100 USDC
```

## Delegation Flag Dependency

```typescript
// The finite approval amount is only available when delegation
// is enabled because the backend provides better quotes

const isDelegationEnabled =
  getRemoteConfig().delegation_enabled ||
  getExperimentalFlag(DELEGATION);

if (isDelegationEnabled) {
  // Quote will include approvalAmount
  // unlock() will use finite approval ✅
} else {
  // Quote won't include approvalAmount
  // unlock() falls back to MAX_UINT256 ⚠️
}
```

## Benefits

### 1. Security Enhancement

```
BEFORE (Infinite Approval):
┌─────────────────────────────────────┐
│  User's USDC Balance: 10,000 USDC   │
│  Approved Amount: ∞ USDC             │
│  ⚠️ Risk: ALL tokens exposed         │
└─────────────────────────────────────┘

AFTER (Finite Approval):
┌─────────────────────────────────────┐
│  User's USDC Balance: 10,000 USDC   │
│  Approved Amount: 100 USDC           │
│  ✅ Risk: Only 100 tokens exposed    │
└─────────────────────────────────────┘
```

### 2. User Transparency

```
Wallet UI now shows:
┌────────────────────────────┐
│  Approve USDC              │
│  Amount: 100 USDC          │  ← Clear exact amount
│  Spender: 0x Router...     │
└────────────────────────────┘

Instead of:
┌────────────────────────────┐
│  Approve USDC              │
│  Amount: Unlimited         │  ← Scary!
│  Spender: 0x Router...     │
└────────────────────────────┘
```

### 3. Code Simplification

```
Lines removed: 165
Lines added: 70
Net reduction: 95 lines (-57%)

Removed complexity:
❌ Approval amount calculations in swap action
❌ Approval amount calculations in crosschain swap
❌ Slippage adjustments for approvals
❌ Decimal conversion logic
❌ Edge case handling

Added simplicity:
✅ Single source of truth (quote)
✅ Centralized approval logic (unlock action)
✅ Clear data flow
```

## Edge Cases & Handling

### 1. Quote Doesn't Include Approval Amount

```typescript
// Fallback to infinite approval (legacy behavior)
const approvalAmount = parameters.approvalAmount
  ? parameters.approvalAmount.toString()
  : MaxUint256.toString();  // Safe fallback
```

### 2. Native ETH Swaps

```typescript
// No approval needed for ETH
if (assetToUnlock.address === 'eth') {
  return { nonce: undefined, hash: null };  // Skip unlock
}
```

### 3. Already Sufficient Allowance

```typescript
// Check existing allowance
const currentAllowance = await tokenContract.allowance(
  userAddress,
  spenderAddress
);

if (currentAllowance >= requiredAmount) {
  return { nonce: undefined, hash: null };  // Skip approval
}
```

### 4. Approval Amount Too Small (Slippage)

```typescript
// Quote includes slippage buffer in approvalAmount
// Example: Swap 100, but approve 101 for slippage
const quote = {
  sellAmount: "100000000",     // 100 USDC
  approvalAmount: "101000000", // 101 USDC (1% buffer)
};
```

## Migration Path

### Old RAPs (before this change)

```typescript
// unlock-and-swap RAP (OLD)
const actions = [
  {
    type: 'unlock',
    parameters: {
      assetToUnlock: USDC,
      // No approvalAmount ⚠️
    }
  },
  {
    type: 'swap',
    parameters: {
      quote,
      // Swap action calculated approval amount
    }
  }
];
```

### New RAPs (after this change)

```typescript
// unlock-and-swap RAP (NEW)
const actions = [
  {
    type: 'unlock',
    parameters: {
      assetToUnlock: USDC,
      approvalAmount: quote.approvalAmount, // ✅ From quote
    }
  },
  {
    type: 'swap',
    parameters: {
      quote,
      // Swap action doesn't calculate anything
    }
  }
];
```

## Testing Considerations

### Unit Tests

1. **Unlock Action**
   - ✓ Uses approvalAmount when provided
   - ✓ Falls back to MAX_UINT256 when not provided
   - ✓ Skips approval for native ETH
   - ✓ Skips approval if allowance sufficient

2. **Quote Integration**
   - ✓ Quote includes approvalAmount field
   - ✓ approvalAmount matches or exceeds sellAmount
   - ✓ approvalAmount includes slippage buffer

3. **RAP Execution**
   - ✓ unlock() receives correct approvalAmount
   - ✓ swap() doesn't calculate approval amount
   - ✓ crosschainSwap() doesn't calculate approval amount

### Integration Tests

```typescript
// Test: Finite approval flow
it('approves exact amount from quote', async () => {
  const quote = {
    sellAmount: '100000000',      // 100 USDC
    approvalAmount: '100000000',  // Exact amount
  };

  const rap = createUnlockAndSwapRap({ quote });
  const result = await executeRap(rap);

  // Verify approval was for exact amount
  expect(result.approvalAmount).toBe('100000000');
  expect(result.approvalAmount).not.toBe(MaxUint256.toString());
});

// Test: Legacy fallback
it('falls back to infinite when approvalAmount missing', async () => {
  const quote = {
    sellAmount: '100000000',
    // No approvalAmount
  };

  const rap = createUnlockAndSwapRap({ quote });
  const result = await executeRap(rap);

  expect(result.approvalAmount).toBe(MaxUint256.toString());
});
```

### Security Tests

```typescript
// Test: Approval amount never exceeds balance
it('does not approve more than balance', async () => {
  const userBalance = '50000000';  // 50 USDC
  const quote = {
    sellAmount: '100000000',       // Wants to swap 100
    approvalAmount: '100000000',
  };

  // Should fail at execution, not approval
  await expect(executeRap(rap)).rejects.toThrow('Insufficient balance');
});

// Test: Approval amount sufficient for swap
it('approves enough for swap with slippage', async () => {
  const quote = {
    sellAmount: '100000000',       // 100 USDC
    buyAmount: '99000000',         // 99 USDC (after slippage)
    approvalAmount: '101000000',   // 101 USDC (buffer)
  };

  const result = await executeRap(rap);
  expect(result.success).toBe(true);
});
```

## Impact on User Experience

### Before
```
🔓 Step 1: Approve unlimited USDC
   ⚠️ Warning: This allows the contract to spend
      all your USDC forever

🔄 Step 2: Swap 100 USDC for ETH
```

### After
```
🔓 Step 1: Approve 100 USDC
   ✅ Only approving the exact amount needed

🔄 Step 2: Swap 100 USDC for ETH
```

## Dependencies

**Requires from Branch 2:**
- ✓ Delegation SDK configured
- ✓ Feature flags system
- ✓ Backend integration

**Provides to next branches:**
- ✓ Secure approval pattern
- ✓ Simplified RAP actions
- ✓ Quote-driven approval amounts

## Files to Review

### Critical
- `src/raps/actions/unlock.ts` - Core approval logic
- `src/entities/transactions/transaction.ts` - Quote interface

### Important
- `src/raps/actions/swap.ts` - Simplified swap action
- `src/raps/actions/crosschainSwap.ts` - Simplified crosschain

### Nice to Have
- `src/raps/unlockAndSwap.ts` - RAP creation
- `src/raps/utils.ts` - Utility functions
