# Branch 6: daniel/7702-revoke-ui

**User Control: Revocation Panel with Contextual Reasons**

## Overview

This branch implements a comprehensive UI for revoking delegations with multiple contextual reasons, gas fee display, and a hold-to-activate button to prevent accidental revocations. It provides users with full control over their delegation status.

## Commits (4)

1. `ba812a229` - feat: add gas fee display to RevokeDelegationPanel
2. `eeb83470d` - feat: revoke reason, ui types
3. `ba26afb9e` - fix: pass nonce for transaction consistency
4. `48538a792` - feat: add revoke delegation panel

## Files Changed (6 files, +400/-1)

```
src/languages/en_US.json                         |  24 ++
src/navigation/Routes.android.tsx                |   2 +
src/navigation/Routes.ios.tsx                    |   2 +
src/navigation/routesNames.ts                    |   1 +
src/navigation/types.ts                          |  11 +-
src/screens/delegation/RevokeDelegationPanel.tsx | 361 +++++++++++++++++++++++
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              Revoke Entry Points                    │
├─────────────────────────────────────────────────────┤
│  • Settings → Smart Wallet → Revoke Network        │
│  • Settings → Disable Smart Wallet                 │
│  • Security Alert (unknown delegation detected)    │
│  • Third-party conflict detection                  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Navigate to:         │
          │ REVOKE_DELEGATION_   │
          │ PANEL                │
          └──────────┬───────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│         RevokeDelegationPanel Component             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  HEADER (Reason-dependent)                    │ │
│  │  • Title                                      │ │
│  │  • Subtitle/explanation                       │ │
│  │  • Accent color gradient                      │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  GAS FEE DISPLAY (useGas hook)                │ │
│  │  • Current gas price                          │ │
│  │  • Estimated cost in USD                      │ │
│  │  • Network fee breakdown                      │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  HOLD TO ACTIVATE BUTTON                      │ │
│  │  • Progress indicator                         │ │
│  │  • Haptic feedback                            │ │
│  │  • Prevents accidental taps                   │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  STATUS STATE MACHINE                         │ │
│  │  notReady → ready → claiming → pending        │ │
│  │             → success / recoverableError      │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ executeRevoke        │
          │ Delegation()         │
          │ (@rainbow-me/        │
          │  delegation SDK)     │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Transaction          │
          │ submitted to chain   │
          └──────────────────────┘
```

## Key Changes

### 1. Revoke Reasons Enum

```typescript
// src/screens/delegation/RevokeDelegationPanel.tsx

/**
 * Reasons for revoking delegation - determines the panel's
 * appearance and messaging
 */
export enum RevokeReason {
  /** User manually chose to disable Smart Wallet for all chains */
  DISABLE_SMART_WALLET = 'disable_smart_wallet',

  /** User manually chose to revoke a single network delegation */
  REVOKE_SINGLE_NETWORK = 'revoke_single_network',

  /** Third-party Smart Wallet provider detected - user can switch to Rainbow */
  THIRD_PARTY_CONFLICT = 'third_party_conflict',

  /** Security concern - unknown delegation detected */
  SECURITY_ALERT = 'security_alert',

  /** User-initiated revoke from settings */
  SETTINGS_REVOKE = 'settings_revoke',
}
```

### 2. Status State Machine

```typescript
export type RevokeStatus =
  | 'notReady'           // Preparing data necessary to revoke
  | 'ready'              // Ready to revoke
  | 'claiming'           // User has pressed the button
  | 'pending'            // Transaction submitted, waiting for hash
  | 'success'            // Transaction confirmed
  | 'recoverableError'   // Failed, can retry
  | 'unrecoverableError'; // Failed, cannot retry

const [status, setStatus] = useState<RevokeStatus>('notReady');
```

### 3. Reason-Dependent UI Content

```typescript
const getSheetContent = (
  reason: RevokeReason,
  chainName?: string
): SheetContent => {
  switch (reason) {
    case RevokeReason.DISABLE_SMART_WALLET:
      return {
        title: 'Disable Smart Wallet',
        subtitle: 'This will revoke delegation on all networks',
        buttonLabel: 'Hold to Disable',
        accentColor: globalColors.blue60,
      };

    case RevokeReason.REVOKE_SINGLE_NETWORK:
      return {
        title: `Revoke ${chainName} Delegation`,
        subtitle: 'Smart Wallet will be disabled on this network',
        buttonLabel: 'Hold to Revoke',
        accentColor: globalColors.blue60,
      };

    case RevokeReason.THIRD_PARTY_CONFLICT:
      return {
        title: 'Switch to Rainbow Smart Wallet',
        subtitle: 'Another smart wallet provider was detected',
        buttonLabel: 'Hold to Switch',
        accentColor: globalColors.orange60,  // Warning color
      };

    case RevokeReason.SECURITY_ALERT:
      return {
        title: 'Unknown Delegation Detected',
        subtitle: 'Revoke this delegation for security',
        buttonLabel: 'Hold to Revoke',
        accentColor: globalColors.red,  // Alert color
      };

    // ... more cases
  }
};
```

### 4. Gas Fee Display

```typescript
// Hook for real-time gas prices
const { gasFeeParamsBySpeed, currentBaseFee } = useGas({
  chainId,
});

// Calculate revoke transaction gas estimate
const [estimatedGas, setEstimatedGas] = useState<GasFee | null>(null);

useEffect(() => {
  async function estimateRevoke() {
    try {
      const gasLimit = await estimateRevokeDelegationGas({
        chainId,
        address,
      });

      const gasFee = calculateGasFee({
        gasLimit,
        gasPrices: gasFeeParamsBySpeed.fast,
      });

      setEstimatedGas(gasFee);
      setStatus('ready');
    } catch (error) {
      logger.error(new RainbowError('Gas estimation failed'), { error });
      setStatus('unrecoverableError');
    }
  }

  estimateRevoke();
}, [chainId, address]);

// Display in UI
<Box>
  <Text size="17pt" weight="semibold" color="label">
    Network Fee
  </Text>
  <Text size="17pt" weight="bold" color="label">
    {estimatedGas ? formatCurrency(estimatedGas.totalCost) : '...'}
  </Text>
</Box>
```

### 5. Hold-to-Activate Button

```typescript
<HoldToActivateButton
  label={sheetContent.buttonLabel}
  disabled={status !== 'ready'}
  loading={status === 'claiming' || status === 'pending'}
  onHold={handleRevoke}
  accentColor={sheetContent.accentColor}
  hapticType="notificationSuccess"
/>
```

### 6. Revoke Execution

```typescript
const handleRevoke = useCallback(async () => {
  setStatus('claiming');
  haptics.notificationSuccess();

  try {
    // Load wallet
    const wallet = await loadWallet(walletId, false);
    if (!wallet) {
      throw new RainbowError('Failed to load wallet');
    }

    // Get provider
    const provider = getProvider({ chainId });

    // Get nonce for consistency
    const nonce = await getNextNonce({
      address: address as Address,
      chainId,
    });

    setStatus('pending');

    // Execute revocation
    const hash = await executeRevokeDelegation({
      chainId,
      wallet: wallet as Wallet,
      nonce,
      gasParams: {
        maxFeePerGas: estimatedGas.maxFeePerGas,
        maxPriorityFeePerGas: estimatedGas.maxPriorityFeePerGas,
      },
    });

    logger.info('Delegation revoked successfully', {
      chainId,
      address,
      hash,
    });

    setStatus('success');

    // Navigate back after success
    setTimeout(() => {
      navigation.goBack();
    }, 1500);

  } catch (error) {
    logger.error(new RainbowError('Revoke delegation failed'), {
      error,
      chainId,
      address,
    });

    // Determine if error is recoverable
    if (isRecoverableError(error)) {
      setStatus('recoverableError');
    } else {
      setStatus('unrecoverableError');
    }
  }
}, [chainId, address, walletId, estimatedGas]);

function isRecoverableError(error: any): boolean {
  return (
    error.code === 'INSUFFICIENT_FUNDS' ||
    error.message?.includes('gas too low') ||
    error.code === 'NONCE_EXPIRED'
  );
}
```

## UI Component Structure

```
┌──────────────────────────────────────────────────┐
│  RevokeDelegationPanel                           │
│  ┌────────────────────────────────────────────┐  │
│  │  PanelSheet                                │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │  LinearGradient                      │  │  │
│  │  │  (Accent color based on reason)      │  │  │
│  │  │  ┌────────────────────────────────┐  │  │  │
│  │  │  │  Box (Header)                  │  │  │  │
│  │  │  │  • Title (32pt, bold)          │  │  │  │
│  │  │  │  • Subtitle (17pt, medium)     │  │  │  │
│  │  │  └────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  │                                            │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │  Separator                           │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  │                                            │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │  Gas Fee Section                     │  │  │
│  │  │  ┌────────────────────────────────┐  │  │  │
│  │  │  │  Icon: ⛽                       │  │  │  │
│  │  │  │  Label: "Network Fee"          │  │  │  │
│  │  │  │  Amount: "$2.50"               │  │  │  │
│  │  │  └────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  │                                            │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │  HoldToActivateButton                │  │  │
│  │  │  "Hold to Revoke"                    │  │  │
│  │  │  [████████░░] Progress bar           │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

## Navigation Integration

```typescript
// src/navigation/types.ts

export type RootStackParamList = {
  // ... other routes

  REVOKE_DELEGATION_PANEL: {
    address: Address;
    chainId: ChainId;
    walletId: string;
    reason: RevokeReason;
    chainName?: string;
  };
};
```

```typescript
// src/navigation/routesNames.ts

export default {
  // ... other routes
  REVOKE_DELEGATION_PANEL: 'RevokeDelegationPanel',
} as const;
```

```typescript
// Usage: Navigate to revoke panel
navigation.navigate(Routes.REVOKE_DELEGATION_PANEL, {
  address: userAddress,
  chainId: 1,
  walletId: 'wallet-123',
  reason: RevokeReason.REVOKE_SINGLE_NETWORK,
  chainName: 'Ethereum',
});
```

## Localization

```json
// src/languages/en_US.json

{
  "wallet": {
    "delegations": {
      "revoke_panel": {
        "disable_title": "Disable Smart Wallet",
        "disable_subtitle": "This will revoke delegation on all networks. You can re-enable it anytime.",
        "disable_button": "Hold to Disable",

        "revoke_network_title": "Revoke {{network}} Delegation",
        "revoke_network_subtitle": "Smart Wallet will be disabled on {{network}} only.",
        "revoke_network_button": "Hold to Revoke",

        "conflict_title": "Switch to Rainbow Smart Wallet",
        "conflict_subtitle": "Another smart wallet provider was detected. Switch to Rainbow for the best experience.",
        "conflict_button": "Hold to Switch",

        "security_title": "Unknown Delegation Detected",
        "security_subtitle": "An unknown delegation was found on your wallet. Revoke it to protect your funds.",
        "security_button": "Hold to Revoke",

        "network_fee": "Network Fee",
        "estimating": "Estimating...",
        "success": "Delegation Revoked",
        "error_recoverable": "Transaction failed. Please try again.",
        "error_unrecoverable": "Unable to revoke delegation. Please contact support."
      }
    }
  }
}
```

## Status Flow Diagram

```
┌──────────────┐
│  notReady    │  ← Initial state, loading gas estimate
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   ready      │  ← Gas estimate loaded, button enabled
└──────┬───────┘
       │
       │ User holds button
       ▼
┌──────────────┐
│  claiming    │  ← Button held, starting transaction
└──────┬───────┘
       │
       │ Transaction submitted
       ▼
┌──────────────┐
│  pending     │  ← Waiting for transaction hash
└──────┬───────┘
       │
       ├─────────────┬──────────────┐
       │             │              │
       ▼             ▼              ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────────┐
│  success    │  │ recoverable  │  │ unrecoverable    │
│             │  │ Error        │  │ Error            │
│ Navigate    │  │              │  │                  │
│ back        │  │ Show retry   │  │ Show error       │
│             │  │ button       │  │ message          │
└─────────────┘  └──────┬───────┘  └──────────────────┘
                        │
                        │ User taps retry
                        ▼
                 ┌──────────────┐
                 │   ready      │
                 └──────────────┘
```

## Error Handling

### Recoverable Errors

```typescript
// User can retry these
const recoverableErrors = [
  'INSUFFICIENT_FUNDS',     // User needs to add funds
  'GAS_PRICE_TOO_LOW',      // Gas price increased
  'NONCE_EXPIRED',          // Nonce conflict, can retry
  'NETWORK_TIMEOUT',        // Network issue, can retry
];

if (isRecoverableError(error)) {
  setStatus('recoverableError');
  // Show retry button
  <Button onPress={() => setStatus('ready')}>
    Try Again
  </Button>
}
```

### Unrecoverable Errors

```typescript
// Cannot retry, show error message
const unrecoverableErrors = [
  'WALLET_NOT_FOUND',       // Critical error
  'INVALID_CHAIN_ID',       // Configuration error
  'DELEGATION_NOT_ACTIVE',  // Already revoked
  'UNKNOWN_ERROR',          // Unexpected error
];

if (!isRecoverableError(error)) {
  setStatus('unrecoverableError');
  // Show error message
  <Text color="red">
    Unable to revoke delegation. Please contact support.
  </Text>
}
```

## Testing Considerations

### UI Tests

```typescript
describe('RevokeDelegationPanel', () => {
  it('displays correct content for each reason', () => {
    const reasons = [
      RevokeReason.DISABLE_SMART_WALLET,
      RevokeReason.REVOKE_SINGLE_NETWORK,
      RevokeReason.THIRD_PARTY_CONFLICT,
      RevokeReason.SECURITY_ALERT,
    ];

    reasons.forEach(reason => {
      const { getByText } = render(
        <RevokeDelegationPanel
          route={{ params: { reason, chainId: 1, address, walletId } }}
        />
      );

      const content = getSheetContent(reason);
      expect(getByText(content.title)).toBeTruthy();
      expect(getByText(content.subtitle)).toBeTruthy();
    });
  });

  it('shows gas estimate when loaded', async () => {
    mockEstimateGas.mockResolvedValue('50000');

    const { getByText } = render(<RevokeDelegationPanel {...props} />);

    await waitFor(() => {
      expect(getByText(/\$2\.50/)).toBeTruthy();
    });
  });

  it('disables button until gas estimate loads', () => {
    const { getByTestId } = render(<RevokeDelegationPanel {...props} />);

    const button = getByTestId('hold-to-activate-button');
    expect(button.props.disabled).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('Revoke delegation flow', () => {
  it('revokes delegation successfully', async () => {
    const { getByTestId, getByText } = render(
      <RevokeDelegationPanel
        route={{
          params: {
            reason: RevokeReason.REVOKE_SINGLE_NETWORK,
            chainId: 1,
            address: userAddress,
            walletId: 'wallet-123',
          },
        }}
      />
    );

    // Wait for gas estimate
    await waitFor(() => {
      expect(getByText(/\$/)).toBeTruthy();
    });

    // Hold button
    const button = getByTestId('hold-to-activate-button');
    fireEvent.press(button);
    fireEvent(button, 'onHoldComplete');

    // Wait for success
    await waitFor(() => {
      expect(executeRevokeDelegation).toHaveBeenCalledWith({
        chainId: 1,
        wallet: expect.any(Object),
        nonce: expect.any(Number),
        gasParams: expect.any(Object),
      });
    });

    expect(getByText('Delegation Revoked')).toBeTruthy();
  });
});
```

## Security Considerations

### 1. Hold-to-Activate Protection

```typescript
// Prevents accidental taps
<HoldToActivateButton
  holdDuration={800}  // Must hold for 800ms
  onHold={handleRevoke}
/>

// User must intentionally hold button
// Quick taps don't trigger revocation
```

### 2. Wallet Authentication

```typescript
// Always load wallet fresh (no caching sensitive data)
const wallet = await loadWallet(walletId, false);
                                       // ^^^^^ skipCache = true

if (!wallet) {
  throw new RainbowError('Wallet authentication failed');
}
```

### 3. Nonce Management

```typescript
// Get fresh nonce to prevent nonce conflicts
const nonce = await getNextNonce({
  address,
  chainId,
});

// Use in revocation to ensure consistency
await executeRevokeDelegation({
  nonce,  // Prevents double-revoke or stale nonce issues
  // ...
});
```

## Dependencies

**Requires from Branch 5:**
- ✓ Atomic execution capability
- ✓ Transaction metadata support
- ✓ Delegation SDK integration

**Provides to next branches:**
- ✓ Revocation UI component
- ✓ RevokeReason enum for different contexts
- ✓ Gas estimation for revocations

## Files to Review

### Critical
- `src/screens/delegation/RevokeDelegationPanel.tsx` - Main component (361 lines)
- `src/navigation/types.ts` - Route params

### Important
- `src/languages/en_US.json` - Localization strings
- `src/navigation/Routes.*.tsx` - Route registration

### Nice to Have
- `src/navigation/routesNames.ts` - Route name constant
