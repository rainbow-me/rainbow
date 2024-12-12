import * as i18n from '@/languages';
import React, { useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import ConditionalWrap from 'conditional-wrap';
import { Box, Column, Columns, Inline, Stack, Text, Inset, useForegroundColor, useColorMode, TextIcon } from '@/design-system';
import { AddressItem, AddressMenuAction, AddressMenuActionData } from '@/screens/change-wallet/ChangeWalletSheet';
import { TextSize } from '@/design-system/typography/typeHierarchy';
import { TextWeight } from '@/design-system/components/Text/Text';
import { opacity } from '@/__swaps__/utils/swaps';
import { usePinnedWalletsStore } from '@/state/wallets/pinnedWalletsStore';
import { AddressAvatar } from '@/screens/change-wallet/AddressAvatar';
import { SelectedAddressBadge } from '@/screens/change-wallet/SelectedAddressBadge';
import { DropdownMenu, MenuItem } from '@/components/DropdownMenu';
import { haptics } from '@/utils';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';

const ROW_HEIGHT_WITH_PADDING = 64;

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
    <ButtonPressAnimation disallowInterruption onPress={onPress} scaleTo={0.8} disabled={disabled}>
      <Box
        alignItems="center"
        borderRadius={14}
        height={{ custom: 28 }}
        justifyContent="center"
        style={{
          backgroundColor: color ? opacity(color, isDarkMode ? 0.16 : 0.25) : isDarkMode ? fillQuaternary : opacity(fillTertiary, 0.04),
        }}
        width={{ custom: 28 }}
      >
        <TextIcon
          color={color ? { custom: color } : 'labelQuaternary'}
          containerSize={28}
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
  const { address, color, secondaryLabel, isSelected, isReadOnly, isLedger, label: walletName, image } = data;

  const addPinnedAddress = usePinnedWalletsStore(state => state.addPinnedAddress);

  const { colors, isDarkMode } = useTheme();

  const linearGradientProps = useMemo(
    () => ({
      pointerEvents: 'none' as const,
      style: {
        borderRadius: 12,
        height: 22,
        justifyContent: 'center',
        paddingHorizontal: 8,
      } as const,
      colors: [colors.alpha(colors.blueGreyDark, 0.03), colors.alpha(colors.blueGreyDark, isDarkMode ? 0.02 : 0.06)],
      end: { x: 1, y: 1 },
      start: { x: 0, y: 0 },
    }),
    [colors, isDarkMode]
  );

  const menuConfig = {
    menuItems: menuItems,
    menuTitle: walletName,
  };

  return (
    <ConditionalWrap
      condition={!editMode}
      wrap={(children: React.ReactElement) => (
        <DropdownMenu<AddressMenuAction, AddressMenuActionData>
          triggerAction="longPress"
          menuConfig={menuConfig}
          onPressMenuItem={action => onPressMenuItem(action, { address })}
        >
          {/* TODO: there is some issue with how the dropdown long press interacts with the button long press. Inconsistent behavior. */}
          <ButtonPressAnimation minLongPressDuration={150} scaleTo={0.96} onPress={onPress}>
            {children}
          </ButtonPressAnimation>
        </DropdownMenu>
      )}
    >
      <Box width="full" height={{ custom: ROW_HEIGHT_WITH_PADDING }}>
        <Inset horizontal="16px">
          <Columns alignVertical="center" space="12px">
            {editMode && (
              <Column width="content">
                <TextIcon color="labelTertiary" size="icon 14px" weight="heavy">
                  􀍠
                </TextIcon>
              </Column>
            )}
            <Column width="content">
              <AddressAvatar url={image} size={40} address={address} color={color} label={walletName} />
            </Column>
            <Stack space="10px">
              <Text numberOfLines={1} color="label" size="17pt" weight="medium" testID={`change-wallet-address-row-label-${walletName}`}>
                {walletName}
              </Text>
              <Text numberOfLines={1} color="labelQuaternary" size="13pt" weight="bold">
                {secondaryLabel}
              </Text>
            </Stack>
            <Column width="content" style={{ backgroundColor: 'transparent' }}>
              <Inline space="10px" alignVertical="center">
                {isReadOnly && (
                  <LinearGradient {...linearGradientProps}>
                    <Text color="labelTertiary" size="13pt" weight="bold">
                      {i18n.t(i18n.l.wallet.change_wallet.watching)}
                    </Text>
                  </LinearGradient>
                )}
                {isLedger && (
                  <LinearGradient {...linearGradientProps}>
                    <Text color="labelTertiary" size="13pt" weight="bold">
                      {i18n.t(i18n.l.wallet.change_wallet.ledger)}
                    </Text>
                  </LinearGradient>
                )}
                {!editMode && isSelected && <SelectedAddressBadge />}
                {editMode && (
                  <AddressRowButton onPress={() => addPinnedAddress(address)} color={colors.appleBlue} icon="􀎧" size="icon 12px" />
                )}
                {editMode && (
                  <DropdownMenu<AddressMenuAction, AddressMenuActionData>
                    menuConfig={menuConfig}
                    onPressMenuItem={action => onPressMenuItem(action, { address })}
                  >
                    <AddressRowButton icon="􀍠" size="icon 12px" />
                  </DropdownMenu>
                )}
              </Inline>
            </Column>
          </Columns>
        </Inset>
      </Box>
    </ConditionalWrap>
  );
}
