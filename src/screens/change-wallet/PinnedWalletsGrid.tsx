import { Draggable, DraggableGrid, DraggableGridProps, UniqueIdentifier } from '@/components/drag-and-drop';
import { DndProvider } from '@/components/drag-and-drop/DndProvider';
import { Box, Inline, Stack, Text } from '@/design-system';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import React, { useCallback, useMemo } from 'react';
import { AddressItem, AddressMenuAction, AddressMenuActionData } from './ChangeWalletSheet';
import { AddressAvatar } from './AddressAvatar';
import { ButtonPressAnimation } from '@/components/animations';
import { BlurView } from '@react-native-community/blur';
import { usePinnedWalletsStore } from '@/state/wallets/pinnedWalletsStore';
import { View } from 'react-native';
import { SelectedAddressBadge } from './SelectedAddressBadge';
import { JiggleAnimation } from '@/components/animations/JiggleAnimation';
import { DropdownMenu, MenuItem } from '@/components/DropdownMenu';
import ConditionalWrap from 'conditional-wrap';

const UNPIN_BADGE_SIZE = 28;
const PINS_PER_ROW = 3;
const MAX_AVATAR_SIZE = 91;
const HORIZONTAL_PAGE_INSET = 24;

type PinnedWalletsGridProps = {
  walletItems: AddressItem[];
  onPress: (address: string) => void;
  menuItems: MenuItem<AddressMenuAction>[];
  onPressMenuItem: (actionKey: AddressMenuAction, data: AddressMenuActionData) => void;
  editMode: boolean;
};

export function PinnedWalletsGrid({ walletItems, onPress, editMode, menuItems, onPressMenuItem }: PinnedWalletsGridProps) {
  const removePinnedAddress = usePinnedWalletsStore(state => state.removePinnedAddress);
  const reorderPinnedAddresses = usePinnedWalletsStore(state => state.reorderPinnedAddresses);

  const onGridOrderChange: DraggableGridProps['onOrderChange'] = useCallback(
    (value: UniqueIdentifier[]) => {
      // TODO: once upstream dnd is integrated
      // reorderPinnedAddresses(value as string[]);
    },
    [reorderPinnedAddresses]
  );

  const fillerItems = useMemo(() => {
    const itemsInLastRow = walletItems.length % PINS_PER_ROW;
    return Array.from({ length: itemsInLastRow === 0 ? 0 : PINS_PER_ROW - itemsInLastRow });
  }, [walletItems.length]);

  // TODO: scale down if cannot fit three items in row
  const avatarSize = MAX_AVATAR_SIZE;

  return (
    <Box paddingTop="20px" paddingBottom="28px" alignItems="center" justifyContent="center" paddingHorizontal="24px">
      {walletItems.length > 0 ? (
        <DndProvider disabled={!editMode} activationDelay={0}>
          <DraggableGrid
            direction="row"
            // TODO: design spec is 28px, but is too large
            gap={24}
            onOrderChange={onGridOrderChange}
            size={PINS_PER_ROW}
            style={{
              width: '100%',
            }}
          >
            {walletItems.map(account => (
              <Draggable
                disabled={!editMode}
                activationTolerance={DEVICE_WIDTH}
                activeScale={1.06}
                id={account.address}
                key={account.address}
              >
                <ConditionalWrap
                  condition={!editMode}
                  wrap={(children: React.ReactElement) => (
                    <DropdownMenu<AddressMenuAction, AddressMenuActionData>
                      triggerAction="longPress"
                      menuConfig={{ menuItems, menuTitle: account.label }}
                      onPressMenuItem={action => onPressMenuItem(action, { address: account.address })}
                    >
                      {/* TODO: there is some issue with how the dropdown long press interacts with the button long press. Inconsistent behavior. */}
                      <ButtonPressAnimation
                        disallowInterruption
                        scaleTo={0.96}
                        onPress={() => onPress(account.address)}
                        minLongPressDuration={150}
                      >
                        {children}
                      </ButtonPressAnimation>
                    </DropdownMenu>
                  )}
                >
                  <View style={{ width: avatarSize }}>
                    <Stack space="12px" alignHorizontal="center">
                      <JiggleAnimation enabled={editMode}>
                        <Box
                          // required to prevent artifacts when jiggle animation is active
                          shouldRasterizeIOS
                        >
                          <Box
                            width={{ custom: avatarSize }}
                            height={{ custom: avatarSize }}
                            background="blue"
                            shadow={
                              account.isSelected
                                ? {
                                    custom: {
                                      ios: [
                                        {
                                          x: 0,
                                          y: 10,
                                          blur: 30,
                                          opacity: 0.3,
                                          color: 'blue',
                                        },
                                        {
                                          x: 0,
                                          y: 2,
                                          blur: 6,
                                          opacity: 0.02,
                                          color: 'shadowFar',
                                        },
                                      ],
                                      android: {
                                        elevation: 30,
                                        opacity: 0.3,
                                        color: 'blue',
                                      },
                                    },
                                  }
                                : undefined
                            }
                            borderRadius={avatarSize / 2}
                            borderWidth={account.isSelected ? 4 : undefined}
                            borderColor={account.isSelected ? { custom: '#268FFF' } : undefined}
                          >
                            <AddressAvatar
                              url={account.image}
                              size={avatarSize}
                              address={account.address}
                              color={account.color}
                              label={account.label}
                            />
                          </Box>
                          {account.isSelected && (
                            <Box position="absolute" bottom={{ custom: 4 }} right={{ custom: 4 }}>
                              <SelectedAddressBadge />
                            </Box>
                          )}
                          {editMode && (
                            <ButtonPressAnimation onPress={() => removePinnedAddress(account.address)}>
                              <Box
                                as={BlurView}
                                width={{ custom: UNPIN_BADGE_SIZE }}
                                height={{ custom: UNPIN_BADGE_SIZE }}
                                position="absolute"
                                bottom={'0px'}
                                right={'0px'}
                                justifyContent="center"
                                alignItems="center"
                                borderRadius={UNPIN_BADGE_SIZE / 2}
                                blurAmount={24}
                              >
                                <Text color="label" size="icon 12px" weight="bold">
                                  {'􀅽'}
                                </Text>
                              </Box>
                            </ButtonPressAnimation>
                          )}
                        </Box>
                      </JiggleAnimation>
                      <Inline wrap={false} space="4px" alignHorizontal="center" alignVertical="center">
                        {account.isLedger && (
                          <Text color="labelTertiary" size="icon 10px">
                            􀤃
                          </Text>
                        )}
                        {account.isReadOnly && (
                          <Text color="labelTertiary" size="icon 10px">
                            􀋮
                          </Text>
                        )}
                        <Text numberOfLines={1} ellipsizeMode="middle" color="label" size="13pt" weight="bold">
                          {account.label}
                        </Text>
                      </Inline>
                      <Text color="labelSecondary" size="13pt" weight="medium">
                        {account.secondaryLabel}
                      </Text>
                    </Stack>
                  </View>
                </ConditionalWrap>
              </Draggable>
            ))}
            {fillerItems.map((_, index) => (
              <Box
                background="fillQuaternary"
                key={index}
                width={{ custom: avatarSize }}
                height={{ custom: avatarSize }}
                borderRadius={avatarSize / 2}
              />
            ))}
          </DraggableGrid>
        </DndProvider>
      ) : null}
    </Box>
  );
}
