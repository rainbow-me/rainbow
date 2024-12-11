import { Draggable, DraggableGrid, DraggableGridProps, UniqueIdentifier } from '@/components/drag-and-drop';
import { DndProvider } from '@/components/drag-and-drop/DndProvider';
import { Box, Inline, Stack, Text } from '@/design-system';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import React, { useCallback, useMemo } from 'react';
import { AddressItem } from './ChangeWalletSheet';
import { AddressAvatar } from './AddressAvatar';
import { ButtonPressAnimation } from '@/components/animations';
import { BlurView } from '@react-native-community/blur';
import { usePinnedWalletsStore } from '@/state/wallets/pinnedWalletsStore';
import { View } from 'react-native';
import { SelectedAddressBadge } from './SelectedAddressBadge';

const UNPIN_BADGE_SIZE = 28;
const PINS_PER_ROW = 3;
const MAX_AVATAR_SIZE = 91;
const HORIZONTAL_PAGE_INSET = 24;

type PinnedWalletsGridProps = {
  walletItems: AddressItem[];
  onPress: (walletId: string, address: string) => void;
  editMode: boolean;
};

export function PinnedWalletsGrid({ walletItems, onPress, editMode }: PinnedWalletsGridProps) {
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
        <DndProvider activationDelay={150}>
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
              <Draggable activationTolerance={DEVICE_WIDTH} activeScale={1.06} id={account.address} key={account.address}>
                <View style={{ width: avatarSize }}>
                  <Stack space="12px" alignHorizontal="center">
                    <Box>
                      <ButtonPressAnimation disallowInterruption onPress={() => onPress(account.walletId, account.address)} scaleTo={0.8}>
                        <Box
                          borderRadius={avatarSize / 2}
                          borderWidth={account.isSelected ? 4 : undefined}
                          borderColor={account.isSelected ? { custom: '#268FFF' } : undefined}
                          // shadow={'30px blue'}
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
                      </ButtonPressAnimation>
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
                    <Inline wrap={false} space="4px" alignHorizontal="center" alignVertical="center">
                      {account.isLedger && (
                        <Text color="label" size="icon 10px">
                          􀤃
                        </Text>
                      )}
                      {account.isReadOnly && (
                        <Text color="label" size="icon 10px">
                          􀋮
                        </Text>
                      )}
                      <Text numberOfLines={1} color="label" size="13pt" weight="bold">
                        {account.label}
                      </Text>
                    </Inline>
                    <Text color="labelSecondary" size="13pt" weight="medium">
                      {account.secondaryLabel}
                    </Text>
                  </Stack>
                </View>
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
