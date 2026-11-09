import React, { useCallback, useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';

import ConditionalWrap from 'conditional-wrap';
import { BlurView } from 'react-native-blur-view';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { type Address } from 'viem';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { JiggleAnimation } from '@/components/animations/JiggleAnimation';
import { Draggable } from '@/components/drag-and-drop/components/Draggable';
import { DraggableGrid, type DraggableGridProps } from '@/components/drag-and-drop/features/sort/components/DraggableGrid';
import { type UniqueIdentifier } from '@/components/drag-and-drop/types/common';
import { DropdownMenu, type MenuItem } from '@/components/DropdownMenu';
import { PANEL_WIDTH } from '@/components/SmoothPager/ListPanel';
import {
  AccentColorProvider,
  Box,
  globalColors,
  HitSlop,
  Inline,
  Stack,
  Text,
  TextIcon,
  useColorMode,
  useForegroundColor,
} from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import { IS_STORE_INSTALL } from '@/env';
import { abbreviateAddress } from '@/features/address/core/formatAddress';
import { useIsDelegationEnabled } from '@/features/delegation/utils/featureFlags';
import {
  isRainbowDelegated as hasRainbowDelegation,
  isThirdPartyDelegated as hasThirdPartyDelegation,
} from '@/features/delegation/utils/status';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import { getCachedImageColor } from '@/hooks/usePersistentDominantColorFromImage';
import { usePinnedWalletsStore } from '@/state/wallets/pinnedWalletsStore';
import { useTheme } from '@/theme/ThemeContext';
import { useDelegationDisabled, useDelegations } from '@rainbow-me/sdk';

import { AddressMenuAction, type AddressItem, type AddressMenuActionData } from '../model';
import { AddressAvatar } from './AddressAvatar';
import { SelectedAddressBadge } from './SelectedAddressBadge';

const UNPIN_BADGE_SIZE = 28;
const PINS_PER_ROW = 3;
const MAX_GRID_GAP_X = 40;
const MIN_GRID_GAP_X = 24;
const MAX_AVATAR_SIZE = 90;
const PINNED_PANEL_INSET_HORIZONTAL = 24;

const AVAILABLE_WIDTH = PANEL_WIDTH - PINNED_PANEL_INSET_HORIZONTAL * 2;
const AVATAR_SIZE = Math.floor(Math.min(MAX_AVATAR_SIZE, (AVAILABLE_WIDTH - (PINS_PER_ROW - 1) * MIN_GRID_GAP_X) / PINS_PER_ROW));
const AVATAR_GAP = {
  x: Math.floor(Math.min(MAX_GRID_GAP_X, (AVAILABLE_WIDTH - PINS_PER_ROW * AVATAR_SIZE) / (PINS_PER_ROW - 1))),
  y: 16,
};

type PinnedWalletsGridProps = {
  walletItems: AddressItem[];
  onPress: (address: string) => void;
  menuItems: MenuItem<AddressMenuAction>[];
  onPressMenuItem: (actionKey: AddressMenuAction, data: AddressMenuActionData) => void;
  editMode: boolean;
};

function DelegationBadge({ accountAddress }: { accountAddress: string }) {
  const delegations = useDelegations(accountAddress as Address);
  const isDisabled = useDelegationDisabled(accountAddress as Address);
  const isDelegated = delegations?.some(hasRainbowDelegation) ?? false;
  const isThirdPartyDelegated = delegations?.some(hasThirdPartyDelegation) ?? false;

  return (
    <Text color={isDisabled ? 'red' : isDelegated ? 'green' : isThirdPartyDelegated ? 'labelTertiary' : 'labelQuaternary'} size="icon 10px">
      􀋦
    </Text>
  );
}

export function PinnedWalletsGrid({ walletItems, onPress, editMode, menuItems, onPressMenuItem }: PinnedWalletsGridProps) {
  const delegationEnabled = useIsDelegationEnabled();
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();
  const fillQuaternary = useForegroundColor('fillQuaternary');

  const unpinWallet = usePinnedWalletsStore(state => state.unpinWallet);
  const setPinnedAddresses = usePinnedWalletsStore(state => state.setPinnedAddresses);

  const onOrderChange: DraggableGridProps['onOrderChange'] = useCallback(
    (value: UniqueIdentifier[]) => {
      setPinnedAddresses(value as string[]);
    },
    [setPinnedAddresses]
  );

  const onOrderUpdateWorklet: DraggableGridProps['onOrderUpdateWorklet'] = useCallback(() => {
    'worklet';
    triggerHaptics('impactLight');
  }, []);

  const fillerItems = useMemo(() => {
    const itemsInLastRow = walletItems.length % PINS_PER_ROW;
    return Array.from({ length: itemsInLastRow === 0 ? 0 : PINS_PER_ROW - itemsInLastRow });
  }, [walletItems.length]);

  // the draggable context should only layout its children when the number of children changes
  const draggableItems = useMemo(() => {
    return walletItems;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletItems.length]);

  return (
    <Box paddingBottom="28px" alignItems="center" justifyContent="center">
      <DraggableGrid
        direction="row"
        gap={AVATAR_GAP}
        // This is a hack to force the DraggableGrid to re-layout its children when the number of children changes
        // A fix was implemented for the DraggableStack and DraggableScrollView, but it does not account for wrapping columns / rows
        // This is fine as there are a max of 6 pinned addresses
        key={draggableItems.length}
        onOrderChange={onOrderChange}
        onOrderUpdateWorklet={onOrderUpdateWorklet}
        size={PINS_PER_ROW}
        style={{
          justifyContent: 'center',
          paddingTop: 16,
          width: '100%',
        }}
      >
        {draggableItems.map(account => {
          const walletName = removeFirstEmojiFromString(account.label) || abbreviateAddress(account.address, 4, 4);
          const filteredMenuItems = menuItems.filter(item => (account.isReadOnly ? item.actionKey !== AddressMenuAction.Settings : true));
          return (
            <Draggable id={account.address} key={account.address}>
              <ConditionalWrap
                condition={!editMode}
                wrap={(children: React.ReactElement) => (
                  <DropdownMenu<AddressMenuAction>
                    triggerAction="longPress"
                    menuConfig={{
                      menuItems: filteredMenuItems,
                      menuTitle: walletName,
                    }}
                    onPressMenuItem={action => onPressMenuItem(action, { address: account.address })}
                  >
                    <ButtonPressAnimation scaleTo={0.86} onPress={() => onPress(account.address)}>
                      {children}
                    </ButtonPressAnimation>
                  </DropdownMenu>
                )}
              >
                <Stack width={{ custom: AVATAR_SIZE }} space="10px" alignHorizontal="center">
                  <JiggleAnimation enabled={editMode}>
                    <Box
                      // required to prevent artifacts when jiggle animation is active
                      shouldRasterizeIOS
                    >
                      <AccentColorProvider color={getCachedImageColor(account.image) || colors.avatarBackgrounds[account.color]}>
                        <Box
                          width={AVATAR_SIZE}
                          height={AVATAR_SIZE}
                          shadow={
                            account.isSelected
                              ? {
                                  custom: {
                                    ios: [
                                      {
                                        x: 0,
                                        y: 2,
                                        blur: 6,
                                        opacity: 0.02,
                                        color: 'shadowFar',
                                      },
                                      {
                                        x: 0,
                                        y: 10,
                                        blur: 30,
                                        opacity: 0.3,
                                        color: { custom: colors.appleBlue },
                                      },
                                    ],
                                    android: {
                                      elevation: 30,
                                      opacity: 0.3,
                                      color: 'blue',
                                    },
                                  },
                                }
                              : '30px accent'
                          }
                          borderRadius={AVATAR_SIZE / 2}
                          borderWidth={account.isSelected ? 4 : undefined}
                          borderColor={account.isSelected ? { custom: '#268FFF' } : undefined}
                          style={{ backgroundColor: isDarkMode ? '#191A1C' : globalColors.white100 }}
                        >
                          <AddressAvatar
                            address={account.address}
                            color={account.color}
                            emoji={account.emoji}
                            label={account.label}
                            size={AVATAR_SIZE}
                            url={account.image}
                          />
                        </Box>
                      </AccentColorProvider>
                      {account.isSelected && (
                        <Box position="absolute" bottom={{ custom: 4 }} right={{ custom: 4 }}>
                          <SelectedAddressBadge />
                        </Box>
                      )}
                      {editMode && (
                        <Box position="absolute" bottom={'0px'} right={'0px'}>
                          <ButtonPressAnimation onPress={() => unpinWallet(account.address)}>
                            <HitSlop space="16px">
                              <Box
                                width={{ custom: UNPIN_BADGE_SIZE }}
                                height={{ custom: UNPIN_BADGE_SIZE }}
                                justifyContent="center"
                                alignItems="center"
                                backgroundColor={Platform.OS === 'ios' ? 'transparent' : colors.darkGrey}
                                borderRadius={UNPIN_BADGE_SIZE / 2}
                                style={{ overflow: 'hidden' }}
                              >
                                {Platform.OS === 'ios' && (
                                  <BlurView
                                    blurStyle={isDarkMode ? 'materialDark' : 'materialLight'}
                                    style={[StyleSheet.absoluteFill, { borderRadius: UNPIN_BADGE_SIZE / 2, overflow: 'hidden' }]}
                                  />
                                )}
                                <TextIcon color="label" containerSize={UNPIN_BADGE_SIZE} size="icon 12px" weight="heavy">
                                  {'􀅽'}
                                </TextIcon>
                              </Box>
                            </HitSlop>
                          </ButtonPressAnimation>
                        </Box>
                      )}
                    </Box>
                  </JiggleAnimation>
                  <Stack alignHorizontal="center" space="8px">
                    <Inline wrap={false} space="4px" alignHorizontal="center" alignVertical="center">
                      {account.isLedger && (
                        <Text align="center" color="labelTertiary" size="icon 10px">
                          􀤃
                        </Text>
                      )}
                      {account.isReadOnly && (
                        <Text align="center" color="labelTertiary" size="icon 10px">
                          􀋮
                        </Text>
                      )}
                      {!IS_STORE_INSTALL && delegationEnabled && !account.isReadOnly ? (
                        <DelegationBadge accountAddress={account.address} />
                      ) : null}

                      <Text align="center" numberOfLines={1} ellipsizeMode="middle" color="label" size="13pt" weight="bold">
                        {walletName}
                      </Text>
                    </Inline>
                    <Text align="center" numberOfLines={1} ellipsizeMode="tail" color="labelTertiary" size="13pt" weight="medium">
                      {account.balance}
                    </Text>
                  </Stack>
                </Stack>
              </ConditionalWrap>
            </Draggable>
          );
        })}
        {fillerItems.map((_, index) => (
          <Box
            borderColor={{ custom: opacity(fillQuaternary, 0.01) }}
            borderRadius={AVATAR_SIZE / 2}
            height={{ custom: AVATAR_SIZE }}
            key={index}
            style={{ backgroundColor: opacity(fillQuaternary, 0.01) }}
            width={{ custom: AVATAR_SIZE }}
          />
        ))}
      </DraggableGrid>
    </Box>
  );
}
