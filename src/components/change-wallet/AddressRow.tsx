import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText } from '../coin-row';
import ConditionalWrap from 'conditional-wrap';
import CoinCheckButton from '../coin-row/CoinCheckButton';
import { ContactAvatar } from '../contacts';
import ImageAvatar from '../contacts/ImageAvatar';
import { Icon } from '../icons';
import { Centered, Column, ColumnWithMargins, Row } from '../layout';
import { Text, TruncatedText } from '../text';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import useExperimentalFlag, { NOTIFICATIONS } from '@/config/experimentalHooks';
import { removeFirstEmojiFromString, returnStringFirstEmoji } from '@/helpers/emojiHandler';
import styled from '@/styled-thing';
import { fonts, fontWithWidth, getFontSize } from '@/styles';
import { abbreviations, deviceUtils, profileUtils } from '@/utils';
import { EditWalletContextMenuActions } from '@/screens/ChangeWalletSheet';
import { toChecksumAddress } from '@/handlers/web3';
import { IS_IOS, IS_ANDROID } from '@/env';
import { ContextMenu } from '../context-menu';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { useForegroundColor } from '@/design-system';

const maxAccountLabelWidth = deviceUtils.dimensions.width - 88;
const NOOP = () => undefined;

const sx = StyleSheet.create({
  accountLabel: {
    fontFamily: fonts.family.SFProRounded,
    fontSize: getFontSize(fonts.size.lmedium),
    fontWeight: fonts.weight.medium as '500',
    letterSpacing: fonts.letterSpacing.roundedMedium,
    maxWidth: maxAccountLabelWidth,
  },
  accountRow: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 19,
  },
  bottomRowText: {
    fontWeight: fonts.weight.medium as '500',
    letterSpacing: fonts.letterSpacing.roundedMedium,
  },
  coinCheckIcon: {
    width: 60,
  },
  editIcon: {
    color: '#0E76FD',
    fontFamily: fonts.family.SFProRounded,
    fontSize: getFontSize(fonts.size.large),
    fontWeight: fonts.weight.heavy as '800',
    textAlign: 'center',
  },
  gradient: {
    alignSelf: 'center',
    borderRadius: 24,
    height: 26,
    justifyContent: 'center',
    marginLeft: 19,
    textAlign: 'center',
  },
  rightContent: {
    flex: 0,
    flexDirection: 'row',
    marginLeft: 48,
  },
});

const gradientProps = {
  pointerEvents: 'none',
  style: sx.gradient,
};

const StyledTruncatedText = styled(TruncatedText)({
  ...sx.accountLabel,
  ...fontWithWidth(sx.accountLabel.fontWeight),
});

const StyledBottomRowText = styled(BottomRowText)({
  ...sx.bottomRowText,
  ...fontWithWidth(sx.bottomRowText.fontWeight),
});

const ReadOnlyText = styled(Text).attrs({
  align: 'center',
  letterSpacing: 'roundedMedium',
  size: 'smedium',
  weight: 'semibold',
})({
  paddingHorizontal: 8,
});

const OptionsIcon = ({ onPress }: { onPress: () => void }) => {
  const { colors } = useTheme();
  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.9}>
      <Centered height={40} width={60}>
        {IS_ANDROID ? <Icon circle color={colors.appleBlue} name="threeDots" tightDots /> : <Text style={sx.editIcon}>􀍡</Text>}
      </Centered>
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
  data: any;
  editMode: boolean;
  onPress: () => void;
}

export default function AddressRow({ contextMenuActions, data, editMode, onPress }: AddressRowProps) {
  const nativeCurrency = useSelector((state: AppState) => state.settings.nativeCurrency);
  const notificationsEnabled = useExperimentalFlag(NOTIFICATIONS);

  const { address, balance, color: accountColor, ens, image: accountImage, isSelected, isReadOnly, isLedger, label, walletId } = data;

  const { colors, isDarkMode } = useTheme();

  const labelQuaternary = useForegroundColor('labelQuaternary');

  const cleanedUpBalance = useMemo(() => {
    if (balance) {
      return convertAmountToNativeDisplay(balance, nativeCurrency);
    } else {
      return lang.t('wallet.change_wallet.no_balance');
    }
  }, [balance, nativeCurrency]);

  const cleanedUpLabel = useMemo(() => removeFirstEmojiFromString(label), [label]);

  const emoji = useMemo(() => returnStringFirstEmoji(label) || profileUtils.addressHashedEmoji(address), [address, label]);

  const displayAddress = useMemo(() => abbreviations.address(toChecksumAddress(address) || address, 4, 6), [address]);

  const walletName = cleanedUpLabel || ens || displayAddress;

  const linearGradientProps = useMemo(
    () => ({
      ...gradientProps,
      colors: [colors.alpha(colors.blueGreyDark, 0.03), colors.alpha(colors.blueGreyDark, isDarkMode ? 0.02 : 0.06)],
      end: { x: 1, y: 1 },
      start: { x: 0, y: 0 },
    }),
    [colors, isDarkMode]
  );

  const contextMenuItems = [
    {
      actionKey: ContextMenuKeys.Edit,
      actionTitle: lang.t('wallet.action.edit'),
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'pencil',
      },
    },

    ...(notificationsEnabled
      ? [
          {
            actionKey: ContextMenuKeys.Notifications,
            actionTitle: lang.t('wallet.action.notifications.action_title'),
            icon: {
              iconType: 'SYSTEM',
              iconValue: 'bell.fill',
            },
          },
        ]
      : []),
    {
      actionKey: ContextMenuKeys.Remove,
      actionTitle: lang.t('wallet.action.remove'),
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'trash.fill',
      },
      menuAttributes: ['destructive'],
    },
  ];

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
    <View style={sx.accountRow}>
      <ConditionalWrap
        condition={!editMode}
        wrap={(children: React.ReactNode) => (
          <ButtonPressAnimation onPress={onPress} scaleTo={0.98}>
            {children}
          </ButtonPressAnimation>
        )}
      >
        <Row align="center">
          <Row align="center" flex={1} height={59}>
            {accountImage ? (
              <ImageAvatar image={accountImage} marginRight={10} size="medium" />
            ) : (
              <ContactAvatar color={accountColor} marginRight={10} size="medium" value={emoji} />
            )}
            <ColumnWithMargins margin={IS_ANDROID ? -6 : 3}>
              <StyledTruncatedText color={colors.dark} testID={`change-wallet-address-row-label-${walletName}`}>
                {walletName}
              </StyledTruncatedText>
              <StyledBottomRowText color={labelQuaternary}>{cleanedUpBalance}</StyledBottomRowText>
            </ColumnWithMargins>
          </Row>
          <Column style={sx.rightContent}>
            {isReadOnly && (
              <LinearGradient
                {...linearGradientProps}
                // @ts-expect-error JavaScript component
                marginRight={editMode || isSelected ? -9 : 19}
              >
                <ReadOnlyText color={colors.alpha(colors.blueGreyDark, 0.5)}>{lang.t('wallet.change_wallet.watching')}</ReadOnlyText>
              </LinearGradient>
            )}
            {isLedger && (
              <LinearGradient
                {...linearGradientProps}
                // @ts-expect-error JavaScript component
                marginRight={editMode || isSelected ? -9 : 19}
              >
                <ReadOnlyText color={colors.alpha(colors.blueGreyDark, 0.5)}>{lang.t('wallet.change_wallet.ledger')}</ReadOnlyText>
              </LinearGradient>
            )}
            {!editMode && isSelected && (
              // @ts-expect-error JavaScript component
              <CoinCheckButton style={sx.coinCheckIcon} toggle={isSelected} />
            )}
            {editMode &&
              (IS_IOS ? (
                <ContextMenuButton isMenuPrimaryAction menuConfig={menuConfig} onPressMenuItem={handleSelectMenuItem}>
                  <OptionsIcon onPress={NOOP} />
                </ContextMenuButton>
              ) : (
                <ContextMenu
                  options={menuConfig.menuItems.map(item => item.actionTitle)}
                  isAnchoredToRight
                  onPressActionSheet={handleSelectActionMenuItem}
                >
                  <Centered>
                    <OptionsIcon onPress={NOOP} />
                  </Centered>
                </ContextMenu>
              ))}
          </Column>
        </Row>
      </ConditionalWrap>
    </View>
  );
}
