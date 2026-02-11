# Branch 1: daniel/7702-swap-sdk

**Foundation Layer: Address Type Safety & Swap SDK Upgrade**

## Overview

This branch establishes the foundation for EIP-7702 delegation by upgrading the swap SDK and enforcing strict address type safety across the codebase. It ensures consistent handling of Ethereum addresses and prepares the type system for delegation functionality.

## Commits (5)

1. `2aaad2e32` - funding: fix Address vs AddressOrEth type safety
2. `20600d35f` - fix: hyperliquid address typing
3. `e44425449` - fix: backend network address types
4. `6dd533132` - fix: swap sdk address type safety
5. `07bfce835` - chore: upgrade to swap sdk 0.41.0

## Files Changed (15 files, +96/-58)

```
package.json                                       |  2 +-
src/__swaps__/utils/swaps.ts                       |  9 +++---
src/features/perps/constants.ts                    | 17 ++++++------
src/resources/assets/externalAssetsQuery.ts        |  6 ++--
.../context/TransactionClaimableContext.tsx        |  6 ++--
src/screens/claimables/transaction/estimateGas.ts  |  3 +-
src/state/backendNetworks/backendNetworks.ts       |  2 +-
src/state/backendNetworks/types.ts                 |  8 ++++--
src/systems/funding/hooks/useWithdrawalHandler.ts  |  6 +++-
.../funding/stores/createDepositQuoteStore.ts      | 13 +++++----
.../funding/stores/createWithdrawalQuoteStore.ts   |  8 ++++--
.../funding/stores/createWithdrawalTokenStore.ts   |  7 +++--
src/systems/funding/types.ts                       | 30 ++++++++++----------
src/systems/funding/utils/withdrawalSwap.ts        |  5 ++--
yarn.lock                                          | 32 ++++++++++++++++++----
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│         @rainbow-me/swaps 0.40.0 → 0.41.0       │
│  ┌───────────────────────────────────────────┐  │
│  │  Address Type Safety System               │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│  │                                           │  │
│  │  • Address                                │  │
│  │    - Checksummed Ethereum address         │  │
│  │    - 0x + 40 hex characters               │  │
│  │    - Type: `0x${string}`                  │  │
│  │                                           │  │
│  │  • AddressOrEth                           │  │
│  │    - Special case for native ETH          │  │
│  │    - Type: Address | "eth"                │  │
│  │    - Used in swap quotes                  │  │
│  │                                           │  │
│  │  • Consistent typing across:              │  │
│  │    ✓ Quote interfaces                     │  │
│  │    ✓ Network configurations               │  │
│  │    ✓ Funding system                       │  │
│  │    ✓ Backend network types                │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
           ▼                    ▼
    ┌──────────┐         ┌──────────────┐
    │  Swaps   │         │   Funding    │
    │  Utils   │         │   System     │
    └──────────┘         └──────────────┘
```

## Key Changes

### 1. Package Upgrade

```json
// package.json
{
  "dependencies": {
-   "@rainbow-me/swaps": "0.40.0",
+   "@rainbow-me/swaps": "0.41.0",
  }
}
```

### 2. Backend Network Types

```typescript
// src/state/backendNetworks/types.ts

// BEFORE: Loose typing
export type BackendNetwork = {
  address: string;  // ⚠️ Any string
  // ...
};

// AFTER: Strict typing
import { Address } from 'viem';

export type BackendNetwork = {
  address: Address;  // ✓ Type-safe address
  // ...
};
```

### 3. Funding System Types

```typescript
// src/systems/funding/types.ts

import { Address, AddressOrEth } from '@rainbow-me/swaps';

export interface WithdrawalQuote {
  from: Address;           // User's wallet
  to: AddressOrEth;        // Destination (can be "eth" for native)
  sellToken: AddressOrEth; // Token being sold
  buyToken: AddressOrEth;  // Token being bought
  // ...
}

export interface DepositQuote {
  fromAddress: Address;    // Always a proper address
  toAddress: AddressOrEth; // Can be "eth" or address
  // ...
}
```

### 4. Swap Utils Address Handling

```typescript
// src/__swaps__/utils/swaps.ts

// Handle "eth" special case
function getTokenAddress(token: AddressOrEth): Address | null {
  if (token === 'eth') {
    return null; // Native ETH has no contract address
  }
  return token as Address;
}
```

## Type Safety Benefits

### Before: Runtime Errors Possible

```typescript
// ❌ Type system doesn't catch this error
const address = "not-a-valid-address";
const quote = await getSwapQuote({
  from: address,  // Runtime error later
  to: "eth"
});
```

### After: Compile-Time Safety

```typescript
// ✅ TypeScript catches this at compile time
const address = "not-a-valid-address"; // Type error!
//    ^^^^^^^^^
// Type 'string' is not assignable to type 'Address'

const validAddress: Address = "0x1234..."; // ✓ Must be properly formatted
const quote = await getSwapQuote({
  from: validAddress,
  to: "eth" as AddressOrEth
});
```

## Migration Pattern

Throughout the codebase, the migration follows this pattern:

```typescript
// BEFORE
interface OldType {
  address: string;
  token: string;
}

// AFTER
import { Address, AddressOrEth } from '@rainbow-me/swaps';

interface NewType {
  address: Address;
  token: AddressOrEth;  // Use when "eth" is valid
}
```

## Testing Considerations

### Type Safety Tests

1. **Address Format Validation**
   - ✓ Rejects non-checksummed addresses
   - ✓ Rejects addresses without 0x prefix
   - ✓ Rejects addresses with wrong length

2. **AddressOrEth Handling**
   - ✓ Accepts valid addresses
   - ✓ Accepts "eth" string
   - ✓ Rejects other strings

3. **Funding System**
   - ✓ Withdrawal quotes handle "eth" correctly
   - ✓ Deposit quotes validate addresses
   - ✓ Token swaps preserve address types

### Edge Cases

```typescript
// Native ETH as both sell and buy token
const ethToEth: WithdrawalQuote = {
  from: userAddress,
  to: "eth",
  sellToken: "eth",
  buyToken: "eth",  // Valid for bridging
};

// Token to ETH
const tokenToEth: WithdrawalQuote = {
  from: userAddress,
  to: "eth",
  sellToken: usdcAddress,
  buyToken: "eth",
};

// ETH to token
const ethToToken: WithdrawalQuote = {
  from: userAddress,
  to: daiAddress,
  sellToken: "eth",
  buyToken: daiAddress,
};
```

## Impact on Delegation

This branch is critical for delegation because:

1. **EIP-7702 requires precise address handling** - Delegation designations must use exact address formats
2. **Batch transactions need type safety** - Atomic swaps combine multiple operations with addresses
3. **Backend integration** - Simulation and estimation APIs require consistent address types
4. **Cross-chain operations** - Different networks must handle addresses uniformly

## Dependencies for Next Branch

✅ Type-safe address handling across codebase
✅ Swap SDK 0.41.0 installed
✅ Funding system uses correct types
✅ Backend network types aligned

**Ready for:** delegation-sdk integration (Branch 2)

## Files to Review

### Critical
- `src/state/backendNetworks/types.ts` - Core type definitions
- `src/systems/funding/types.ts` - Funding system types
- `package.json` - SDK version

### Important
- `src/__swaps__/utils/swaps.ts` - Address handling utils
- `src/systems/funding/stores/*.ts` - Store implementations

### Nice to Have
- `src/resources/assets/externalAssetsQuery.ts` - Asset queries
- `src/features/perps/constants.ts` - Perps configuration
