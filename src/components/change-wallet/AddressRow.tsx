import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText } from '../coin-row';
import CoinCheckButton from '../coin-row/CoinCheckButton';
import { ContactAvatar } from '../contacts';
import ImageAvatar from '../contacts/ImageAvatar';
import { Icon } from '../icons';
import { Centered, Column, ColumnWithMargins, Row } from '../layout';
import { Text, TruncatedText } from '../text';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import useExperimentalFlag, { NOTIFICATIONS } from '@/config/experimentalHooks';
import {
  removeFirstEmojiFromString,
  returnStringFirstEmoji,
} from '@/helpers/emojiHandler';
import styled from '@/styled-thing';
import { fonts, fontWithWidth, getFontSize } from '@/styles';
import {
  abbreviations,
  deviceUtils,
  profileUtils,
  showActionSheetWithOptions,
} from '@/utils';
import { EditWalletContextMenuActions } from '@/screens/ChangeWalletSheet';
import { toChecksumAddress } from '@/handlers/web3';

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
        {android ? (
          <Icon circle color={colors.appleBlue} name="threeDots" tightDots />
        ) : (
          <Text style={sx.editIcon}>􀍡</Text>
        )}
      </Centered>
    </ButtonPressAnimation>
  );
};

const ContextMenuKeys = {
  Edit: 'edit',
  Notifications: 'notifications',
  Remove: 'remove',
};

export default function AddressRow({
  contextMenuActions,
  data,
  editMode,
}: {
  contextMenuActions: EditWalletContextMenuActions;
  data: any;
  editMode: boolean;
}) {
  const notificationsEnabled = useExperimentalFlag(NOTIFICATIONS);

  const {
    address,
    balance,
    color: accountColor,
    ens,
    image: accountImage,
    isSelected,
    isReadOnly,
    label,
    walletId,
  } = data;

  const { colors, isDarkMode } = useTheme();

  let cleanedUpBalance = balance;
  if (balance === '0.00') {
    cleanedUpBalance = '0';
  }

  const cleanedUpLabel = useMemo(() => removeFirstEmojiFromString(label), [
    label,
  ]);

  const emoji = useMemo(
    () =>
      returnStringFirstEmoji(cleanedUpLabel) ||
      profileUtils.addressHashedEmoji(address),
    [address, cleanedUpLabel]
  );

  const displayAddress = useMemo(
    () => abbreviations.address(toChecksumAddress(address) || '', 4, 6),
    [address]
  );

  const walletName = cleanedUpLabel || ens || displayAddress;

  const linearGradientProps = useMemo(
    () => ({
      ...gradientProps,
      colors: [
        colors.alpha(colors.blueGreyDark, 0.03),
        colors.alpha(colors.blueGreyDark, isDarkMode ? 0.02 : 0.06),
      ],
      end: { x: 1, y: 1 },
      start: { x: 0, y: 0 },
    }),
    [colors, isDarkMode]
  );

  const menuConfig = useMemo(() => {
    return {
      menuItems: [
        {
          actionKey: ContextMenuKeys.Remove,
          actionTitle: lang.t('wallet.action.remove'),
          icon: {
            iconType: 'SYSTEM',
            iconValue: 'trash.fill',
          },
          menuAttributes: ['destructive'],
        },
        notificationsEnabled && {
          actionKey: ContextMenuKeys.Notifications,
          actionTitle: lang.t('wallet.action.notifications'),
          icon: {
            iconType: 'SYSTEM',
            iconValue: 'bell.fill',
          },
        },
        {
          actionKey: ContextMenuKeys.Edit,
          actionTitle: lang.t('wallet.action.edit'),
          icon: {
            iconType: 'SYSTEM',
            iconValue: 'pencil',
          },
        },
      ],
      menuTitle: walletName,
    };
  }, [walletName, notificationsEnabled]);

  const onPressAndroidActions = useCallback(() => {
    const androidActions = notificationsEnabled
      ? [
          lang.t('wallet.action.edit'),
          lang.t('wallet.action.notifications'),
          lang.t('wallet.action.remove'),
        ]
      : [lang.t('wallet.action.edit'), lang.t('wallet.action.remove')];

    showActionSheetWithOptions(
      {
        destructiveButtonIndex: notificationsEnabled ? 2 : 1,
        options: androidActions,
        showSeparators: true,
        title: walletName,
      },
      (idx: number) => {
        if (idx === 0) {
          contextMenuActions?.edit(walletId, address);
        } else if (idx === 1) {
          if (notificationsEnabled) {
            contextMenuActions?.notifications(walletName);
          } else {
            contextMenuActions?.remove(walletId, address);
          }
        } else if (idx === 2) {
          if (notificationsEnabled) {
            contextMenuActions?.remove(walletId, address);
          }
        }
      }
    );
  }, [notificationsEnabled, contextMenuActions, walletId, address, walletName]);

  const handleSelectMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      switch (actionKey) {
        case ContextMenuKeys.Remove:
          contextMenuActions?.remove(walletId, address);
          break;
        case ContextMenuKeys.Notifications:
          contextMenuActions?.notifications(walletName);
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
      <Row align="center">
        <Row align="center" flex={1} height={59}>
          {accountImage ? (
            <ImageAvatar image={accountImage} marginRight={10} size="medium" />
          ) : (
            <ContactAvatar
              color={accountColor}
              marginRight={10}
              size="medium"
              value={emoji}
            />
          )}
          <ColumnWithMargins margin={android ? -6 : 3}>
            <StyledTruncatedText
              color={colors.dark}
              testID={`change-wallet-address-row-label-${walletName}`}
            >
              {walletName}
            </StyledTruncatedText>
            <StyledBottomRowText color={colors.alpha(colors.blueGreyDark, 0.5)}>
              {cleanedUpBalance || 0} ETH
            </StyledBottomRowText>
          </ColumnWithMargins>
        </Row>
        <Column style={sx.rightContent}>
          {isReadOnly && (
            <LinearGradient
              {...linearGradientProps}
              // @ts-ignore
              marginRight={editMode || isSelected ? -9 : 19}
            >
              <ReadOnlyText color={colors.alpha(colors.blueGreyDark, 0.5)}>
                {lang.t('wallet.change_wallet.watching')}
              </ReadOnlyText>
            </LinearGradient>
          )}
          {!editMode && isSelected && (
            // @ts-ignore
            <CoinCheckButton style={sx.coinCheckIcon} toggle={isSelected} />
          )}
          {editMode &&
            (ios ? (
              <ContextMenuButton
                isMenuPrimaryAction
                menuConfig={menuConfig}
                onPressMenuItem={handleSelectMenuItem}
                useActionSheetFallback={false}
              >
                <OptionsIcon onPress={NOOP} />
              </ContextMenuButton>
            ) : (
              <ButtonPressAnimation
                enableHapticFeedback
                onPress={onPressAndroidActions}
                scaleTo={0.9}
              >
                <OptionsIcon onPress={NOOP} />
              </ButtonPressAnimation>
            ))}
        </Column>
      </Row>
    </View>
  );
}
