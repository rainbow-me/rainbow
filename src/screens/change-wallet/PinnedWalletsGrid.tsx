import { Draggable, DraggableGrid, DraggableGridProps, UniqueIdentifier } from '@/components/drag-and-drop';
import { Box, Inline, Stack, Text } from '@/design-system';
import React, { useCallback, useMemo } from 'react';
import { AddressItem, AddressMenuAction, AddressMenuActionData, PANEL_INSET_HORIZONTAL } from './ChangeWalletSheet';
import { AddressAvatar } from './AddressAvatar';
import { ButtonPressAnimation } from '@/components/animations';
import { BlurView } from '@react-native-community/blur';
import { usePinnedWalletsStore } from '@/state/wallets/pinnedWalletsStore';
import { SelectedAddressBadge } from './SelectedAddressBadge';
import { JiggleAnimation } from '@/components/animations/JiggleAnimation';
import { DropdownMenu, MenuItem } from '@/components/DropdownMenu';
import ConditionalWrap from 'conditional-wrap';
import { address } from '@/utils/abbreviations';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import { PANEL_WIDTH } from '@/components/SmoothPager/ListPanel';
import { IS_IOS } from '@/env';
import { useTheme } from '@/theme';

const UNPIN_BADGE_SIZE = 28;
const PINS_PER_ROW = 3;
const GRID_GAP = 26;
const MAX_AVATAR_SIZE = 91;

type PinnedWalletsGridProps = {
  walletItems: AddressItem[];
  onPress: (address: string) => void;
  menuItems: MenuItem<AddressMenuAction>[];
  onPressMenuItem: (actionKey: AddressMenuAction, data: AddressMenuActionData) => void;
  editMode: boolean;
};

export function PinnedWalletsGrid({ walletItems, onPress, editMode, menuItems, onPressMenuItem }: PinnedWalletsGridProps) {
  const { colors, isDarkMode } = useTheme();

  const removePinnedAddress = usePinnedWalletsStore(state => state.removePinnedAddress);
  const reorderPinnedAddresses = usePinnedWalletsStore(state => state.setPinnedAddresses);

  const onOrderChange: DraggableGridProps['onOrderChange'] = useCallback(
    (value: UniqueIdentifier[]) => {
      reorderPinnedAddresses(value as string[]);
    },
    [reorderPinnedAddresses]
  );

  const fillerItems = useMemo(() => {
    const itemsInLastRow = walletItems.length % PINS_PER_ROW;
    return Array.from({ length: itemsInLastRow === 0 ? 0 : PINS_PER_ROW - itemsInLastRow });
  }, [walletItems.length]);

  // the draggable context should only layout its children when the number of children changes
  const draggableItems = useMemo(() => {
    return walletItems;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletItems.length]);

  const avatarSize = useMemo(
    () => Math.min((PANEL_WIDTH - PANEL_INSET_HORIZONTAL * 2 - GRID_GAP * (PINS_PER_ROW - 1)) / PINS_PER_ROW, MAX_AVATAR_SIZE),
    []
  );

  return (
    <Box paddingTop="20px" paddingBottom="28px" alignItems="center" justifyContent="center">
      <DraggableGrid
        direction="row"
        gap={GRID_GAP}
        onOrderChange={onOrderChange}
        size={PINS_PER_ROW}
        style={{
          width: '100%',
          justifyContent: 'center',
        }}
      >
        {draggableItems.map(account => {
          //  TODO: can ens names have emojis? If so this logic is wrong
          const walletName = removeFirstEmojiFromString(account.label) || address(account.address, 4, 4);
          return (
            <Draggable id={account.address} key={account.address}>
              <ConditionalWrap
                condition={!editMode}
                wrap={(children: React.ReactElement) => (
                  <DropdownMenu<AddressMenuAction, AddressMenuActionData>
                    triggerAction="longPress"
                    menuConfig={{
                      menuItems: menuItems.filter(item => (account.isReadOnly ? item.actionKey !== AddressMenuAction.Settings : true)),
                      menuTitle: walletName,
                    }}
                    onPressMenuItem={action => onPressMenuItem(action, { address: account.address })}
                  >
                    <ButtonPressAnimation scaleTo={0.92} onPress={() => onPress(account.address)}>
                      {children}
                    </ButtonPressAnimation>
                  </DropdownMenu>
                )}
              >
                <Stack width={{ custom: avatarSize }} space="12px" alignHorizontal="center">
                  <JiggleAnimation enabled={editMode}>
                    <Box
                      // required to prevent artifacts when jiggle animation is active
                      shouldRasterizeIOS
                    >
                      <Box
                        width={{ custom: avatarSize }}
                        height={{ custom: avatarSize }}
                        background="fill"
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
                                      opacity: 1,
                                      color: 'blue',
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
                            as={IS_IOS ? BlurView : Box}
                            width={{ custom: UNPIN_BADGE_SIZE }}
                            height={{ custom: UNPIN_BADGE_SIZE }}
                            position="absolute"
                            bottom={'0px'}
                            right={'0px'}
                            justifyContent="center"
                            alignItems="center"
                            blurAmount={24}
                            blurType={isDarkMode ? 'materialDark' : 'materialLight'}
                            backgroundColor={IS_IOS ? 'transparent' : colors.darkGrey}
                            borderRadius={UNPIN_BADGE_SIZE / 2}
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
                      {walletName}
                    </Text>
                  </Inline>
                  <Text color="labelSecondary" size="13pt" weight="medium">
                    {account.balance}
                  </Text>
                </Stack>
              </ConditionalWrap>
            </Draggable>
          );
        })}
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
    </Box>
  );
}
