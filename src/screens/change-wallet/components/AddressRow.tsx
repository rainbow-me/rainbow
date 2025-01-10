import * as i18n from '@/languages';
import React, { useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '@/theme/ThemeContext';
import { ButtonPressAnimation } from '@/components/animations';
import ConditionalWrap from 'conditional-wrap';
import { Box, Inline, Stack, Text, useForegroundColor, useColorMode, TextIcon, globalColors } from '@/design-system';
import { AddressItem, AddressMenuAction, AddressMenuActionData } from '@/screens/change-wallet/ChangeWalletSheet';
import { TextSize } from '@/design-system/typography/typeHierarchy';
import { TextWeight } from '@/design-system/components/Text/Text';
import { opacity } from '@/__swaps__/utils/swaps';
import { usePinnedWalletsStore } from '@/state/wallets/pinnedWalletsStore';
import { AddressAvatar } from '@/screens/change-wallet/components/AddressAvatar';
import { SelectedAddressBadge } from '@/screens/change-wallet/components/SelectedAddressBadge';
import { DropdownMenu, MenuItem } from '@/components/DropdownMenu';
import { Icon } from '@/components/icons';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import { address as abbreviateAddress } from '@/utils/abbreviations';

const ROW_HEIGHT_WITH_PADDING = 64;
const BUTTON_SIZE = 28;

export const AddressRowButton = ({
  color,
  icon,
  onPress,
  size,
  weight,
  disabled,
}: {
  color?: string;
  icon: string;
  onPress?: () => void;
  size?: TextSize;
  weight?: TextWeight;
  disabled?: boolean;
}) => {
  const { isDarkMode } = useColorMode();
  const fillTertiary = useForegroundColor('fillTertiary');
  const fillQuaternary = useForegroundColor('fillQuaternary');

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.8} disabled={disabled}>
      <Box
        alignItems="center"
        borderRadius={14}
        height={{ custom: BUTTON_SIZE }}
        width={{ custom: BUTTON_SIZE }}
        justifyContent="center"
        style={{
          // eslint-disable-next-line no-nested-ternary
          backgroundColor: color ? opacity(color, isDarkMode ? 0.16 : 0.25) : isDarkMode ? fillQuaternary : opacity(fillTertiary, 0.04),
        }}
      >
        <TextIcon
          color={color ? { custom: color } : 'labelQuaternary'}
          containerSize={BUTTON_SIZE}
          opacity={isDarkMode ? 1 : 0.75}
          size={size || 'icon 12px'}
          weight={weight || 'heavy'}
        >
          {icon}
        </TextIcon>
      </Box>
    </ButtonPressAnimation>
  );
};
interface AddressRowProps {
  menuItems: MenuItem<AddressMenuAction>[];
  onPressMenuItem: (actionKey: AddressMenuAction, data: { address: string }) => void;
  data: AddressItem;
  editMode: boolean;
  onPress: () => void;
}

export function AddressRow({ data, editMode, onPress, menuItems, onPressMenuItem }: AddressRowProps) {
  const { address, color, balance, isSelected, isReadOnly, isLedger, label, image } = data;

  const walletName = useMemo(() => {
    return removeFirstEmojiFromString(label) || abbreviateAddress(address, 4, 6);
  }, [label, address]);

  const addPinnedAddress = usePinnedWalletsStore(state => state.addPinnedAddress);

  const { colors, isDarkMode } = useTheme();

  const linearGradientProps = useMemo(
    () => ({
      pointerEvents: 'none' as const,
      style: {
        borderRadius: 22,
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: colors.alpha('#F5F8FF', 0.03),
      } as const,
      colors: [colors.alpha(colors.blueGreyDark, 0.03), colors.alpha(colors.blueGreyDark, isDarkMode ? 0.02 : 0.06)],
      end: { x: 1, y: 1 },
      start: { x: 0, y: 0 },
    }),
    [colors, isDarkMode]
  );

  const menuConfig = {
    menuItems: menuItems.filter(item => (isReadOnly ? item.actionKey !== AddressMenuAction.Settings : true)),
    menuTitle: walletName,
  };

  return (
    <ConditionalWrap
      condition={!editMode}
      wrap={(children: React.ReactElement) => (
        <DropdownMenu<AddressMenuAction>
          triggerAction="longPress"
          menuConfig={menuConfig}
          onPressMenuItem={action => onPressMenuItem(action, { address })}
        >
          <ButtonPressAnimation scaleTo={0.96} onPress={onPress}>
            {children}
          </ButtonPressAnimation>
        </DropdownMenu>
      )}
    >
      <Box width="full" height={{ custom: ROW_HEIGHT_WITH_PADDING }} overflow="visible">
        <Inline alignVertical="center">
          {editMode && (
            <Box paddingRight="8px">
              <Icon name="dragHandler" color={colors.alpha(colors.black, 0.2)} />
            </Box>
          )}
          <Box
            as={AddressAvatar}
            url={image}
            size={40}
            borderRadius={20}
            address={address}
            color={color}
            label={label}
            shadow="12px"
            background="surfaceSecondaryElevated"
          />
          <Box style={{ flex: 1 }} paddingLeft="10px" paddingRight="8px">
            <Stack space="10px">
              <Text
                numberOfLines={1}
                color={isSelected ? 'blue' : 'label'}
                size="17pt"
                weight="medium"
                testID={`change-wallet-address-row-label-${walletName}`}
              >
                {walletName}
              </Text>
              <Text numberOfLines={1} color="labelSecondary" size="13pt" weight="medium">
                {balance}
              </Text>
            </Stack>
          </Box>
          <Inline space="10px" alignVertical="center">
            {isReadOnly && (
              <>
                {!editMode ? (
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  <LinearGradient {...linearGradientProps}>
                    <Text color="labelTertiary" size="13pt" weight="bold">
                      {i18n.t(i18n.l.wallet.change_wallet.watching)}
                    </Text>
                  </LinearGradient>
                ) : (
                  <TextIcon color="labelTertiary" size="11pt" weight="bold">
                    􀋮
                  </TextIcon>
                )}
              </>
            )}
            {isLedger && (
              <>
                {!editMode ? (
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  <LinearGradient {...linearGradientProps}>
                    <Inline space="4px" alignVertical="center">
                      <TextIcon color="labelTertiary" size="11pt" weight="bold">
                        􀤃
                      </TextIcon>
                      <Text color="labelTertiary" size="13pt" weight="bold">
                        {i18n.t(i18n.l.wallet.change_wallet.ledger)}
                      </Text>
                    </Inline>
                  </LinearGradient>
                ) : (
                  <TextIcon color="labelTertiary" size="11pt" weight="bold">
                    􀤃
                  </TextIcon>
                )}
              </>
            )}
            {!editMode && isSelected && <SelectedAddressBadge shadow="12px blue" />}
            {editMode && (
              <>
                <AddressRowButton onPress={() => addPinnedAddress(address)} color={colors.appleBlue} icon="􀎧" size="icon 12px" />
                <DropdownMenu<AddressMenuAction> menuConfig={menuConfig} onPressMenuItem={action => onPressMenuItem(action, { address })}>
                  <AddressRowButton icon="􀍠" size="icon 12px" />
                </DropdownMenu>
              </>
            )}
          </Inline>
        </Inline>
      </Box>
    </ConditionalWrap>
  );
}
