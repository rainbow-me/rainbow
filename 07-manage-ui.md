# Branch 7: daniel/7702-manage-ui

**Settings Integration: View & Manage All Wallet Delegations**

## Overview

This branch adds a comprehensive settings screen for viewing and managing all wallet delegations across networks. Users can see delegation status per chain, revoke individual networks, or disable Smart Wallet entirely.

## Commits (1)

1. `15deb91f4` - feat: ViewWalletDelegations settings menu

## Files Changed (6 files, +573/-1)

```
src/languages/en_US.json                           |   9 +-
src/navigation/routesNames.ts                      |   1 +
src/navigation/types.ts                            |   6 +
src/screens/SettingsSheet/SettingsSheet.tsx        |   9 +
.../components/Backups/ViewWalletBackup.tsx        |  25 +
.../components/Backups/ViewWalletDelegations.tsx   | 524 +++++++++++++++++++++
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Settings Entry Point                  │
│                                                 │
│  Settings → Wallets & Backup                    │
│           → [Wallet Name]                       │
│               → Smart Wallet ✨                 │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
       ┌─────────────────────────────┐
       │  Navigate to:               │
       │  VIEW_WALLET_DELEGATIONS    │
       └─────────────┬───────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│      ViewWalletDelegations Component            │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  HEADER                                   │  │
│  │  • Wallet name                            │  │
│  │  • Smart Wallet Status Badge              │  │
│  │    (Active / Disabled)                    │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  NETWORK LIST                             │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  Ethereum Mainnet          Active   │  │  │
│  │  │  [Chain Icon]                  [...] │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  Optimism                  Active   │  │  │
│  │  │  [Chain Icon]                  [...] │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  Base                      Revoked  │  │  │
│  │  │  [Chain Icon]                  [...] │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  DISABLE ALL BUTTON                       │  │
│  │  "Disable Smart Wallet on All Networks"  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
         │                            │
         │ Context Menu               │ Disable All
         ▼                            ▼
┌──────────────────┐        ┌──────────────────────┐
│ • Revoke Network │        │ Navigate to:         │
│ • View Explorer  │        │ REVOKE_DELEGATION_   │
└──────────────────┘        │ PANEL                │
                            │ (all chains)         │
                            └──────────────────────┘
```

## Key Changes

### 1. Settings Menu Integration

```typescript
// src/screens/SettingsSheet/SettingsSheet.tsx

// Add Smart Wallet menu item to wallet settings
<MenuItem
  leftComponent={
    <Text size="icon 23px">✨</Text>
  }
  rightComponent={
    <SmartWalletStatusBadge status={smartWalletStatus} />
  }
  size={52}
  titleComponent={
    <Text size="17pt" weight="semibold">
      Smart Wallet
    </Text>
  }
  onPress={() => {
    navigation.navigate(Routes.VIEW_WALLET_DELEGATIONS, {
      walletId: wallet.id,
      address: wallet.address,
      title: wallet.name,
    });
  }}
/>
```

### 2. ViewWalletDelegations Component

```typescript
// src/screens/SettingsSheet/components/Backups/ViewWalletDelegations.tsx

export default function ViewWalletDelegations() {
  const { params } = useRoute<RouteProp<ViewWalletDelegationsParams>>();
  const { walletId, address, title } = params;

  // Get delegation status for all chains
  const delegations = useDelegations(address);

  // Get supported chains
  const { getSupportedChains } = useBackendNetworksStore();
  const supportedChains = getSupportedChains();

  // Filter to chains with delegation status
  const delegatedChains = supportedChains.filter(chain =>
    delegations.get(chain.id) !== DelegationStatus.NONE
  );

  // Check if any delegations are active
  const hasActiveDelegations = Array.from(delegations.values()).some(
    status => status === DelegationStatus.ACTIVE
  );

  return (
    <MenuContainer>
      <Menu>
        {/* Header with status badge */}
        <Box paddingHorizontal="20px" paddingVertical="12px">
          <Stack space="12px">
            <Text size="20pt" weight="heavy">
              {title}
            </Text>
            <SmartWalletStatusBadge
              status={hasActiveDelegations ? 'active' : 'disabled'}
              text={hasActiveDelegations ? 'Active' : 'Disabled'}
            />
          </Stack>
        </Box>

        <Separator />

        {/* Network cards */}
        {delegatedChains.map(chain => (
          <NetworkCard
            key={chain.id}
            chain={chain}
            status={delegations.get(chain.id)!}
            address={address}
            walletId={walletId}
          />
        ))}

        {/* Disable all button */}
        {hasActiveDelegations && (
          <>
            <Separator />
            <MenuItem
              titleComponent={
                <Text size="17pt" weight="semibold" color="red">
                  Disable Smart Wallet on All Networks
                </Text>
              }
              onPress={() => {
                navigation.navigate(Routes.REVOKE_DELEGATION_PANEL, {
                  address,
                  chainId: delegatedChains[0].id,
                  walletId,
                  reason: RevokeReason.DISABLE_SMART_WALLET,
                });
              }}
            />
          </>
        )}
      </Menu>
    </MenuContainer>
  );
}
```

### 3. Network Card Component

```typescript
type NetworkCardProps = {
  chain: Chain;
  status: DelegationStatus;
  address: Address;
  walletId: string;
};

function NetworkCard({ chain, status, address, walletId }: NetworkCardProps) {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const handleMenuAction = (event: NetworkMenuEvent) => {
    const { actionKey } = event.nativeEvent;

    switch (actionKey) {
      case NetworkMenuAction.RevokeDelegation:
        navigation.navigate(Routes.REVOKE_DELEGATION_PANEL, {
          address,
          chainId: chain.id,
          walletId,
          reason: RevokeReason.REVOKE_SINGLE_NETWORK,
          chainName: chain.name,
        });
        break;

      case NetworkMenuAction.ViewOnExplorer:
        const explorerUrl = ethereumUtils.getBlockExplorerUrl({
          chainId: chain.id,
          address,
        });
        Linking.openURL(explorerUrl);
        break;
    }
  };

  return (
    <GradientBorderView
      borderGradientColors={[
        'rgba(59, 127, 255, 0.16)',
        'rgba(183, 36, 173, 0.16)',
        'rgba(25, 0, 45, 0.16)',
      ]}
      borderWidth={1.5}
      borderRadius={20}
    >
      <ContextMenuButton
        menuItems={[
          {
            actionKey: NetworkMenuAction.RevokeDelegation,
            actionTitle: 'Revoke Delegation',
            icon: { iconType: 'SYSTEM', iconValue: 'xmark.circle' },
            menuState: status === DelegationStatus.ACTIVE ? undefined : 'disabled',
          },
          {
            actionKey: NetworkMenuAction.ViewOnExplorer,
            actionTitle: 'View on Explorer',
            icon: { iconType: 'SYSTEM', iconValue: 'arrow.up.forward' },
          },
        ]}
        onPressMenuItem={handleMenuAction}
      >
        <Box
          paddingHorizontal="16px"
          paddingVertical="12px"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
        >
          {/* Chain icon */}
          <Box flexDirection="row" alignItems="center" gap={12}>
            <ChainImage chainId={chain.id} size={32} />
            <Text size="17pt" weight="semibold">
              {chain.name}
            </Text>
          </Box>

          {/* Status indicator */}
          <Box flexDirection="row" alignItems="center" gap={8}>
            <DelegationStatusIndicator status={status} />
            <ContextCircleButton />
          </Box>
        </Box>
      </ContextMenuButton>
    </GradientBorderView>
  );
}
```

### 4. Smart Wallet Status Badge

```typescript
type SmartWalletStatus = 'active' | 'disabled';

type SmartWalletStatusBadgeProps = {
  status: SmartWalletStatus;
  text: string;
};

const SmartWalletStatusBadge = ({
  status,
  text,
}: SmartWalletStatusBadgeProps) => {
  const isActive = status === 'active';
  const { colors } = useTheme();

  return (
    <GradientBorderView
      borderGradientColors={[
        'rgba(59, 127, 255, 0.16)',
        'rgba(183, 36, 173, 0.16)',
        'rgba(25, 0, 45, 0.16)',
      ]}
      borderWidth={1.667}
      borderRadius={40}
      backgroundColor="transparent"
    >
      <Box
        paddingLeft={{ custom: 9 }}
        paddingRight={{ custom: 5.5 }}
        paddingVertical={{ custom: 7 }}
      >
        <Box flexDirection="row" alignItems="center" gap={4}>
          {/* Label */}
          <Text
            size="13pt"
            weight="heavy"
            color={{ custom: isActive
              ? 'rgba(245, 248, 255, 0.76)'
              : 'rgba(245, 248, 255, 0.56)'
            }}
          >
            {text}
          </Text>

          {/* Status dot */}
          <Box
            width={{ custom: 16 }}
            height={{ custom: 16 }}
            borderRadius={14}
            borderWidth={1.333}
            borderColor={{ custom: 'rgba(255, 255, 255, 0.15)' }}
            backgroundColor={isActive ? '#1DB847' : colors.brightRed}
            alignItems="center"
            justifyContent="center"
          >
            <Text color="white" size="icon 8px" weight="black">
              {isActive ? '􀆅' : '􀆄'}  {/* Checkmark / X */}
            </Text>
          </Box>
        </Box>
      </Box>
    </GradientBorderView>
  );
};
```

### 5. Delegation Status Indicator

```typescript
function DelegationStatusIndicator({
  status
}: {
  status: DelegationStatus
}) {
  const getStatusConfig = (status: DelegationStatus) => {
    switch (status) {
      case DelegationStatus.ACTIVE:
        return {
          text: 'Active',
          color: '#1DB847',
          icon: '􀆅',
        };
      case DelegationStatus.REVOKED:
        return {
          text: 'Revoked',
          color: '#FF6B6B',
          icon: '􀆄',
        };
      case DelegationStatus.NONE:
        return {
          text: 'Not Active',
          color: '#888888',
          icon: '􀀀',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Box flexDirection="row" alignItems="center" gap={4}>
      <Text size="15pt" color={{ custom: config.color }}>
        {config.icon}
      </Text>
      <Text size="15pt" weight="medium" color={{ custom: config.color }}>
        {config.text}
      </Text>
    </Box>
  );
}
```

## Navigation Flow

```
Settings
  └─ Wallets & Backup
      └─ [Wallet Name]
          ├─ View Secret Phrase
          ├─ Export Private Key
          ├─ Smart Wallet ✨  ◀── NEW
          │   │
          │   └─ ViewWalletDelegations
          │       ├─ Network Cards
          │       │   └─ Context Menu
          │       │       ├─ Revoke → RevokeDelegationPanel
          │       │       └─ View on Explorer
          │       │
          │       └─ Disable All → RevokeDelegationPanel
          │
          └─ Remove Wallet
```

## Data Flow

```
┌──────────────────────────────────────────────┐
│  ViewWalletDelegations mounted               │
└────────────────────┬─────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────┐
    │  useDelegations(address)       │
    │  @rainbow-me/delegation SDK    │
    └────────────┬───────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│  Returns: Map<ChainId, DelegationStatus>   │
│  Example:                                  │
│  {                                         │
│    1: ACTIVE,      // Ethereum             │
│    10: ACTIVE,     // Optimism             │
│    137: REVOKED,   // Polygon              │
│    8453: ACTIVE,   // Base                 │
│  }                                         │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│  Filter to supported chains                │
│  const delegatedChains = chains.filter(    │
│    chain => delegations.has(chain.id)      │
│  )                                         │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│  Render network cards                      │
│  • Chain icon                              │
│  • Chain name                              │
│  • Status indicator (Active/Revoked)       │
│  • Context menu                            │
└────────────────────────────────────────────┘
```

## Context Menu Actions

```typescript
enum NetworkMenuAction {
  RevokeDelegation = 'revoke_delegation',
  ViewOnExplorer = 'view_on_explorer',
}

// iOS native context menu
const menuItems = [
  {
    actionKey: NetworkMenuAction.RevokeDelegation,
    actionTitle: 'Revoke Delegation',
    icon: { iconType: 'SYSTEM', iconValue: 'xmark.circle' },
    menuState: status === DelegationStatus.ACTIVE ? undefined : 'disabled',
  },
  {
    actionKey: NetworkMenuAction.ViewOnExplorer,
    actionTitle: 'View on Explorer',
    icon: { iconType: 'SYSTEM', iconValue: 'arrow.up.forward' },
  },
];
```

## Localization

```json
// src/languages/en_US.json

{
  "wallet": {
    "delegations": {
      "manage": {
        "title": "Smart Wallet",
        "status_active": "Active",
        "status_disabled": "Disabled",
        "network_active": "Active",
        "network_revoked": "Revoked",
        "disable_all": "Disable Smart Wallet on All Networks",
        "no_delegations": "Smart Wallet is not enabled on any networks",
        "menu": {
          "revoke": "Revoke Delegation",
          "view_explorer": "View on Explorer"
        }
      }
    }
  }
}
```

## UI States

### Active Delegations

```
┌─────────────────────────────────────────┐
│  My Wallet                              │
│  ┌─────────────────┐                    │
│  │ Active     ✅   │                    │
│  └─────────────────┘                    │
│                                         │
│  ╔═══════════════════════════════════╗  │
│  ║  [ETH] Ethereum         Active [...] ║
│  ╚═══════════════════════════════════╝  │
│                                         │
│  ╔═══════════════════════════════════╗  │
│  ║  [OP]  Optimism        Active [...] ║
│  ╚═══════════════════════════════════╝  │
│                                         │
│  ╔═══════════════════════════════════╗  │
│  ║  Disable Smart Wallet on All      ║  │
│  ║  Networks                         ║  │
│  ╚═══════════════════════════════════╝  │
└─────────────────────────────────────────┘
```

### No Active Delegations

```
┌─────────────────────────────────────────┐
│  My Wallet                              │
│  ┌─────────────────┐                    │
│  │ Disabled   ❌   │                    │
│  └─────────────────┘                    │
│                                         │
│  Smart Wallet is not enabled on any    │
│  networks.                              │
│                                         │
│  Enable it in swap settings to use     │
│  atomic execution.                      │
└─────────────────────────────────────────┘
```

### Mixed Status

```
┌─────────────────────────────────────────┐
│  My Wallet                              │
│  ┌─────────────────┐                    │
│  │ Active     ✅   │                    │
│  └─────────────────┘                    │
│                                         │
│  ╔═══════════════════════════════════╗  │
│  ║  [ETH] Ethereum         Active [...] ║
│  ╚═══════════════════════════════════╝  │
│                                         │
│  ╔═══════════════════════════════════╗  │
│  ║  [MATIC] Polygon       Revoked [...] ║
│  ╚═══════════════════════════════════╝  │
│                                         │
│  ╔═══════════════════════════════════╗  │
│  ║  [BASE] Base           Active  [...] ║
│  ╚═══════════════════════════════════╝  │
│                                         │
│  ╔═══════════════════════════════════╗  │
│  ║  Disable Smart Wallet on All      ║  │
│  ║  Networks                         ║  │
│  ╚═══════════════════════════════════╝  │
└─────────────────────────────────────────┘
```

## Testing Considerations

### Unit Tests

```typescript
describe('ViewWalletDelegations', () => {
  it('displays all delegated chains', () => {
    mockUseDelegations.mockReturnValue(
      new Map([
        [1, DelegationStatus.ACTIVE],
        [10, DelegationStatus.ACTIVE],
        [137, DelegationStatus.REVOKED],
      ])
    );

    const { getAllByTestId } = render(<ViewWalletDelegations {...props} />);

    const networkCards = getAllByTestId('network-card');
    expect(networkCards).toHaveLength(3);
  });

  it('shows "Active" badge when any delegation active', () => {
    mockUseDelegations.mockReturnValue(
      new Map([[1, DelegationStatus.ACTIVE]])
    );

    const { getByText } = render(<ViewWalletDelegations {...props} />);

    expect(getByText('Active')).toBeTruthy();
  });

  it('shows "Disabled" badge when no delegations active', () => {
    mockUseDelegations.mockReturnValue(
      new Map([[1, DelegationStatus.REVOKED]])
    );

    const { getByText } = render(<ViewWalletDelegations {...props} />);

    expect(getByText('Disabled')).toBeTruthy();
  });

  it('shows disable all button only when active delegations exist', () => {
    mockUseDelegations.mockReturnValue(
      new Map([[1, DelegationStatus.ACTIVE]])
    );

    const { getByText } = render(<ViewWalletDelegations {...props} />);

    expect(getByText('Disable Smart Wallet on All Networks')).toBeTruthy();
  });
});
```

### Integration Tests

```typescript
describe('Delegation management flow', () => {
  it('navigates to revoke panel when context menu tapped', async () => {
    const { getByTestId } = render(<ViewWalletDelegations {...props} />);

    const networkCard = getByTestId('network-card-1');
    fireEvent.press(networkCard);

    // Select "Revoke Delegation" from context menu
    fireEvent(networkCard, 'onPressMenuItem', {
      nativeEvent: {
        actionKey: NetworkMenuAction.RevokeDelegation,
      },
    });

    expect(navigation.navigate).toHaveBeenCalledWith(
      Routes.REVOKE_DELEGATION_PANEL,
      expect.objectContaining({
        chainId: 1,
        reason: RevokeReason.REVOKE_SINGLE_NETWORK,
      })
    );
  });

  it('opens block explorer when view on explorer tapped', () => {
    const { getByTestId } = render(<ViewWalletDelegations {...props} />);

    const networkCard = getByTestId('network-card-1');
    fireEvent(networkCard, 'onPressMenuItem', {
      nativeEvent: {
        actionKey: NetworkMenuAction.ViewOnExplorer,
      },
    });

    expect(Linking.openURL).toHaveBeenCalledWith(
      expect.stringContaining('etherscan.io')
    );
  });
});
```

## Performance Considerations

### Delegation Status Caching

```typescript
// useDelegations hook uses internal caching
// No need to manually memoize

const delegations = useDelegations(address);
// ✅ Automatically cached by SDK
// ✅ Updates reactively when delegation changes
// ✅ No unnecessary re-fetches
```

### Network Card Memoization

```typescript
const NetworkCard = React.memo(({ chain, status, address, walletId }) => {
  // Component only re-renders if props change
  // Prevents unnecessary renders when scrolling
});
```

## Dependencies

**Requires from Branch 6:**
- ✓ RevokeDelegationPanel component
- ✓ RevokeReason enum
- ✓ Navigation routes

**Provides to next branches:**
- ✓ Delegation management UI
- ✓ Network-specific revocation flow
- ✓ Settings integration

## Files to Review

### Critical
- `src/screens/SettingsSheet/components/Backups/ViewWalletDelegations.tsx` - Main component (524 lines)
- `src/screens/SettingsSheet/SettingsSheet.tsx` - Settings integration

### Important
- `src/navigation/types.ts` - Route params
- `src/languages/en_US.json` - Localization

### Nice to Have
- `src/screens/SettingsSheet/components/Backups/ViewWalletBackup.tsx` - Reference implementation
- `src/navigation/routesNames.ts` - Route name
