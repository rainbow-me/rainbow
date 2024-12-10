import * as i18n from '@/languages';
import React, { useCallback, useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import ConditionalWrap from 'conditional-wrap';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import useExperimentalFlag, { NOTIFICATIONS } from '@/config/experimentalHooks';
import { IS_IOS } from '@/env';
import { ContextMenu } from '../context-menu';
import { Box, Column, Columns, Inline, Stack, Text, Inset, useForegroundColor, useColorMode, TextIcon } from '@/design-system';
import { MenuActionConfig } from 'react-native-ios-context-menu';
import { AddressItem, EditWalletContextMenuActions } from '@/screens/change-wallet/ChangeWalletSheet';
import { TextSize } from '@/design-system/typography/typeHierarchy';
import { TextWeight } from '@/design-system/components/Text/Text';
import { opacity } from '@/__swaps__/utils/swaps';
import { usePinnedWalletsStore } from '@/state/wallets/pinnedWalletsStore';
import { AddressAvatar } from '@/screens/change-wallet/AddressAvatar';
import { SelectedAddressBadge } from '@/screens/change-wallet/SelectedAddressBadge';

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

const ContextMenuKeys = {
  Edit: 'edit',
  Notifications: 'notifications',
  Remove: 'remove',
};

interface AddressRowProps {
  contextMenuActions: EditWalletContextMenuActions;
  data: AddressItem;
  editMode: boolean;
  onPress: () => void;
}

export function AddressRow({ contextMenuActions, data, editMode, onPress }: AddressRowProps) {
  const notificationsEnabled = useExperimentalFlag(NOTIFICATIONS);

  const { address, color, secondaryLabel, isSelected, isReadOnly, isLedger, label: walletName, walletId, image } = data;

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

  const contextMenuItems = [
    {
      actionKey: ContextMenuKeys.Edit,
      actionTitle: i18n.t(i18n.l.wallet.action.edit),
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'pencil',
      },
    },

    ...(notificationsEnabled
      ? ([
          {
            actionKey: ContextMenuKeys.Notifications,
            actionTitle: i18n.t(i18n.l.wallet.action.notifications.action_title),
            icon: {
              iconType: 'SYSTEM',
              iconValue: 'bell.fill',
            },
          },
        ] as const)
      : []),
    {
      actionKey: ContextMenuKeys.Remove,
      actionTitle: i18n.t(i18n.l.wallet.action.remove),
      icon: { iconType: 'SYSTEM', iconValue: 'trash.fill' },
      menuAttributes: ['destructive'],
    },
  ] satisfies MenuActionConfig[];

  const menuConfig = {
    menuItems: contextMenuItems,
    menuTitle: walletName,
  };

  const handleSelectActionMenuItem = useCallback(
    (buttonIndex: number) => {
      switch (buttonIndex) {
        case 0:
          contextMenuActions?.edit(walletId, address);
          break;
        case 1:
          contextMenuActions?.notifications(walletName, address);
          break;
        case 2:
          contextMenuActions?.remove(walletId, address);
          break;
        default:
          break;
      }
    },
    [contextMenuActions, walletName, walletId, address]
  );

  const handleSelectMenuItem = useCallback(
    // @ts-expect-error ContextMenu is an untyped JS component and can't type its onPress handler properly
    ({ nativeEvent: { actionKey } }) => {
      switch (actionKey) {
        case ContextMenuKeys.Remove:
          contextMenuActions?.remove(walletId, address);
          break;
        case ContextMenuKeys.Notifications:
          contextMenuActions?.notifications(walletName, address);
          break;
        case ContextMenuKeys.Edit:
          contextMenuActions?.edit(walletId, address);
          break;
        default:
          break;
      }
    },
    [address, contextMenuActions, walletName, walletId]
  );

  return (
    <Box height={{ custom: ROW_HEIGHT_WITH_PADDING }}>
      <ConditionalWrap
        condition={!editMode}
        wrap={(children: React.ReactNode) => (
          <ButtonPressAnimation onPress={onPress} scaleTo={0.98}>
            {children}
          </ButtonPressAnimation>
        )}
      >
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
                  <>
                    <AddressRowButton onPress={() => addPinnedAddress(address)} color={colors.appleBlue} icon="􀎧" size="icon 12px" />
                    {IS_IOS ? (
                      <ContextMenuButton
                        isMenuPrimaryAction
                        menuConfig={menuConfig}
                        onPressMenuItem={handleSelectMenuItem}
                        testID={`address-row-info-button-${address}`}
                      >
                        <AddressRowButton icon="􀍠" size="icon 12px" />
                      </ContextMenuButton>
                    ) : (
                      <ContextMenu
                        options={menuConfig.menuItems.map(item => item.actionTitle)}
                        isAnchoredToRight
                        onPressActionSheet={handleSelectActionMenuItem}
                      >
                        <AddressRowButton icon="􀍠" size="icon 12px" />
                      </ContextMenu>
                    )}
                  </>
                )}
              </Inline>
            </Column>
          </Columns>
        </Inset>
      </ConditionalWrap>
    </Box>
  );
}
