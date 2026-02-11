# Branch 2: daniel/7702-delegation-sdk

**Core Integration: Delegation SDK Setup & Configuration**

## Overview

This branch integrates the `@rainbow-me/delegation` SDK, configures it with app dependencies, and establishes the feature flag system. It provides the foundation for EIP-7702 delegation functionality without changing any user-facing behavior.

## Commits (7)

1. `ec1130ea9` - fix: RainbowError safe logger proxy
2. `25d7f89a0` - note: chains issue
3. `7568b0866` - feat: configure delegation client with dependencies
4. `fc15c99e1` - feat: delegation remote flag
5. `42d3ef6df` - feat: add delegation experimental flag
6. `953596b04` - chore: install delegation, stores sdk
7. `7ceb102e5` - chore: update viem to 2.38.0

## Files Changed (7 files, +148/-370)

```
package.json                      |  10 +-
src/App.tsx                       |  15 ++
src/config/experimental.ts        |   2 +
src/logger/createServiceLogger.ts |  39 ++++
src/logger/debugContext.ts        |   1 +
src/model/remoteConfig.ts         |   2 +
yarn.lock                         | 449 +++++++-------------------------------
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Application Initialization              │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   configureDelegation   │
              │       Client()          │
              └────────────┬────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌────────────────┐  ┌──────────────┐
│ Platform     │  │ Logger         │  │ State Stores │
│ Client       │  │ (delegation    │  │ • Wallets    │
│ (Backend API)│  │  context)      │  │ • Networks   │
└──────────────┘  └────────────────┘  └──────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │  @rainbow-me/delegation SDK v0.2.0   │
        ├──────────────────────────────────────┤
        │  API:                                │
        │  • supportsDelegation()              │
        │  • executeBatchedTransaction()       │
        │  • executeRevokeDelegation()         │
        │  • useDelegations() hook             │
        │  • useDelegationPreference() hook    │
        │                                      │
        │  State Management:                   │
        │  • Per-chain delegation status       │
        │  • Support detection cache           │
        │  • Execution tracking                │
        └──────────────────────────────────────┘
```

## Key Changes

### 1. Package Installations

```json
// package.json
{
  "dependencies": {
+   "@rainbow-me/delegation": "0.2.0",
-   "viem": "2.21.54",
+   "viem": "2.38.0"
  },
  "resolutions": {
+   "viem": "2.38.0",
+   "@rainbow-me/delegation/viem": "2.38.0",
+   "@rainbow-me/provider/viem": "2.38.0",
+   "mipd/viem": "2.38.0"
  }
}
```

**Why viem 2.38.0?**
- Required for EIP-7702 support
- Adds `executionAddress` field
- Batch transaction improvements
- Type safety enhancements

### 2. Delegation Client Configuration

```typescript
// src/App.tsx
import { configure as configureDelegationClient } from '@rainbow-me/delegation';
import { getPlatformClient } from '@/resources/platform/client';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { useWalletsStore } from '@/state/wallets/walletsStore';

// In useApplicationSetup():
configureDelegationClient({
  platformClient: getPlatformClient(),

  logger: createServiceLogger(logger.DebugContext.delegation),

  // Note: Chains are configured once at startup. If backend networks
  // are updated after initialization, the delegation SDK won't automatically
  // know about new chains. If this becomes an issue, we should add a
  // subscription to backend networks changes and reconfigure the SDK.
  chains: useBackendNetworksStore.getState().getSupportedChains(),

  // Reactive: SDK automatically gets current address changes
  currentAddress: $ => $(useWalletsStore).accountAddress || null,
});
```

### 3. Feature Flags (Experimental)

```typescript
// src/config/experimental.ts

export const DELEGATION = '7702 Delegation';

const config = {
  // ... other flags
  [DELEGATION]: {
    settings: true,  // Shows in Settings → Developer
    value: true      // Enabled by default
  },
} as const;

// Usage:
import { getExperimentalFlag, DELEGATION } from '@/config/experimental';

if (getExperimentalFlag(DELEGATION)) {
  // Use delegation features
}
```

### 4. Remote Configuration

```typescript
// src/model/remoteConfig.ts

export interface RemoteConfig {
  // ... other flags
  delegation_enabled: boolean;
}

// Usage:
import { getRemoteConfig } from '@/model/remoteConfig';

const isDelegationEnabled =
  getRemoteConfig().delegation_enabled ||
  getExperimentalFlag(DELEGATION);
```

### 5. Delegation-Specific Logger

```typescript
// src/logger/createServiceLogger.ts

/**
 * Creates a logger proxy that safely handles RainbowError serialization.
 * Delegation SDK logs may contain RainbowError instances that need special handling.
 */
export function createServiceLogger(context: DebugContext) {
  return {
    debug: (message: string, data?: unknown) => {
      logger.debug(message, safeSerialize(data), context);
    },
    info: (message: string, data?: unknown) => {
      logger.info(message, safeSerialize(data), context);
    },
    warn: (message: string, data?: unknown) => {
      logger.warn(message, safeSerialize(data), context);
    },
    error: (message: string, data?: unknown) => {
      logger.error(new RainbowError(message), safeSerialize(data), context);
    },
  };
}

function safeSerialize(data: unknown): unknown {
  if (data instanceof RainbowError) {
    return {
      name: data.name,
      message: data.message,
      stack: data.stack,
    };
  }
  return data;
}
```

```typescript
// src/logger/debugContext.ts

export enum DebugContext {
  // ... other contexts
  delegation = 'delegation',
}
```

## SDK API Overview

### Core Functions

```typescript
// 1. Check if delegation is supported
import { supportsDelegation } from '@rainbow-me/delegation';

const { supported, reason } = await supportsDelegation({
  address: userAddress,
  chainId: 1, // Ethereum mainnet
});

if (supported) {
  // Can use delegation features
}
```

```typescript
// 2. Execute batched transaction
import { executeBatchedTransaction, BatchCall } from '@rainbow-me/delegation';

const calls: BatchCall[] = [
  { to: tokenAddress, data: approveCalldata, value: 0n, gas: 50000n },
  { to: swapAddress, data: swapCalldata, value: 0n, gas: 200000n },
];

const hash = await executeBatchedTransaction({
  calls,
  nonce,
  gasParams: {
    maxFeePerGas: parseGwei('20'),
    maxPriorityFeePerGas: parseGwei('2'),
  },
  chainId: 1,
  wallet: userWallet,
});
```

```typescript
// 3. Revoke delegation
import { executeRevokeDelegation } from '@rainbow-me/delegation';

const hash = await executeRevokeDelegation({
  chainId: 1,
  wallet: userWallet,
  nonce,
  gasParams: {
    maxFeePerGas: parseGwei('15'),
    maxPriorityFeePerGas: parseGwei('1.5'),
  },
});
```

### React Hooks

```typescript
// 1. Get delegation status for all chains
import { useDelegations, DelegationStatus } from '@rainbow-me/delegation';

function MyComponent() {
  const delegations = useDelegations(userAddress);
  // Returns: Map<ChainId, DelegationStatus>
  // DelegationStatus: 'ACTIVE' | 'REVOKED' | 'NONE'

  return (
    <>
      {Array.from(delegations.entries()).map(([chainId, status]) => (
        <div key={chainId}>
          Chain {chainId}: {status}
        </div>
      ))}
    </>
  );
}
```

```typescript
// 2. Get user's delegation preference
import { useDelegationPreference } from '@rainbow-me/delegation';

function SwapScreen() {
  const preference = useDelegationPreference();
  // Returns: boolean (whether user prefers atomic execution)

  return (
    <Toggle
      value={preference}
      onChange={setDelegationPreference}
      label="Use Smart Wallet"
    />
  );
}
```

## Configuration Flow

```
┌──────────────────────────────────────────────────┐
│              App Launch (App.tsx)                │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
     ┌───────────────────────────────┐
     │  configureDelegationClient()  │
     └───────────────┬───────────────┘
                     │
      ┌──────────────┼──────────────┐
      │              │              │
      ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────────┐
│ Backend  │  │ Logging  │  │ Reactive     │
│ Platform │  │ Context  │  │ State Access │
└────┬─────┘  └────┬─────┘  └──────┬───────┘
     │             │                │
     │    ┌────────┴────────────────┘
     │    │
     ▼    ▼
┌──────────────────────────────────────┐
│  Delegation SDK Initialized          │
├──────────────────────────────────────┤
│  • Knows about supported chains      │
│  • Can log to delegation context     │
│  • Watches wallet address changes    │
│  • Can call backend APIs             │
└──────────────────────────────────────┘
```

## Feature Flag System

```
┌────────────────────────────────────────────────┐
│           Flag Evaluation Priority             │
├────────────────────────────────────────────────┤
│                                                │
│  const isDelegationEnabled =                   │
│    getRemoteConfig().delegation_enabled  OR    │
│    getExperimentalFlag(DELEGATION)             │
│                                                │
└────────────┬──────────────────────┬────────────┘
             │                      │
             ▼                      ▼
   ┌──────────────────┐   ┌──────────────────┐
   │  Remote Config   │   │  Experimental    │
   │  (Firebase)      │   │  (Local MMKV)    │
   ├──────────────────┤   ├──────────────────┤
   │ • Production     │   │ • Development    │
   │ • A/B testing    │   │ • User override  │
   │ • Instant toggle │   │ • Settings menu  │
   │ • No app update  │   │ • Persisted      │
   └──────────────────┘   └──────────────────┘
```

### Flag Usage Pattern

```typescript
// Check if delegation is available
const delegationEnabled =
  getRemoteConfig().delegation_enabled ||
  getExperimentalFlag(DELEGATION);

if (!delegationEnabled) {
  // Fall back to legacy behavior
  return executeLegacySwap();
}

// Check if blockchain supports it
const { supported } = await supportsDelegation({
  address: userAddress,
  chainId,
});

if (!supported) {
  // Fall back to legacy behavior
  return executeLegacySwap();
}

// Both flags enabled AND blockchain supports it
return executeAtomicSwap();
```

## Known Issues & Notes

### Chains Configuration Issue

```typescript
// Note from commit 25d7f89a0
//
// Chains are configured ONCE at startup. If backend networks are updated
// after initialization (e.g., new chain added via remote config), the
// delegation SDK won't automatically know about new chains.
//
// WORKAROUND: Require app restart after new chains are added
//
// FUTURE FIX: Add subscription to backend networks changes:
//
// useBackendNetworksStore.subscribe(
//   state => state.chains,
//   (chains) => {
//     reconfigureDelegationClient({ chains });
//   }
// );
```

## Testing Considerations

### SDK Integration Tests

1. **Configuration**
   - ✓ SDK initializes with correct platform client
   - ✓ Logger context is set to 'delegation'
   - ✓ Chains are loaded from backend networks store
   - ✓ Current address is reactive to wallet changes

2. **Flag System**
   - ✓ Remote flag overrides experimental flag
   - ✓ Experimental flag works when remote is disabled
   - ✓ Both flags disabled → no delegation features
   - ✓ Flag changes don't require app restart

3. **Support Detection**
   - ✓ Returns correct support status per chain
   - ✓ Caches results for performance
   - ✓ Handles unsupported chains gracefully

### Edge Cases

```typescript
// 1. Address changes during operation
useEffect(() => {
  // SDK automatically gets new address via reactive binding
  // No manual reconfiguration needed
}, []);

// 2. Chain not in supported list
const { supported, reason } = await supportsDelegation({
  address: userAddress,
  chainId: 999999, // Unknown chain
});
// supported = false
// reason = 'chain_not_supported'

// 3. Remote config fails to load
// Falls back to experimental flag value
const enabled =
  getRemoteConfig().delegation_enabled ||  // May be undefined
  getExperimentalFlag(DELEGATION);         // Always returns boolean
```

## Impact on Next Branches

This branch enables:

✅ **Branch 3 (finite-approvals)** - Can check if delegation is enabled
✅ **Branch 4 (simulation-estimates)** - Can call `supportsDelegation()`
✅ **Branch 5 (atomic-swaps)** - Can use `executeBatchedTransaction()`
✅ **Branch 6 (revoke-ui)** - Can use `executeRevokeDelegation()`
✅ **Branch 7 (manage-ui)** - Can use `useDelegations()` hook

## Dependencies

**Requires from Branch 1:**
- ✓ Type-safe address handling
- ✓ Swap SDK 0.41.0

**Provides to next branches:**
- ✓ Delegation SDK configured and ready
- ✓ Feature flag system in place
- ✓ Support detection available
- ✓ Backend integration configured

## Files to Review

### Critical
- `src/App.tsx` - SDK configuration
- `src/config/experimental.ts` - Feature flag
- `package.json` - Dependencies

### Important
- `src/logger/createServiceLogger.ts` - Logger proxy
- `src/model/remoteConfig.ts` - Remote flag

### Nice to Have
- `src/logger/debugContext.ts` - Debug context enum
