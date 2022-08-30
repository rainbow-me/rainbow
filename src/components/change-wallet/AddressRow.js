import lang from 'i18n-js';
import React, { useMemo } from 'react';
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
import { Text, TruncatedAddress, TruncatedText } from '../text';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import {
  removeFirstEmojiFromString,
  returnStringFirstEmoji,
} from '@/helpers/emojiHandler';
import styled from '@/styled-thing';
import { fonts, fontWithWidth, getFontSize } from '@/styles';
import { deviceUtils, profileUtils, showActionSheetWithOptions } from '@/utils';

const maxAccountLabelWidth = deviceUtils.dimensions.width - 88;
const NOOP = () => undefined;

const sx = StyleSheet.create({
  accountLabel: {
    fontFamily: fonts.family.SFProRounded,
    fontSize: getFontSize(fonts.size.lmedium),
    fontWeight: fonts.weight.medium,
    letterSpacing: fonts.letterSpacing.roundedMedium,
    maxWidth: maxAccountLabelWidth,
  },
  accountRow: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 19,
  },
  bottomRowText: {
    fontWeight: fonts.weight.medium,
    letterSpacing: fonts.letterSpacing.roundedMedium,
  },
  coinCheckIcon: {
    width: 60,
  },
  editIcon: {
    color: '#0E76FD',
    fontFamily: fonts.family.SFProRounded,
    fontSize: getFontSize(fonts.size.large),
    fontWeight: fonts.weight.heavy,
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

const OptionsIcon = ({ onPress }) => {
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

export default function AddressRow({
  data,
  editMode,
  getEditMenuItems,
  getOnMenuItemPress,
  onPress,
  watchOnly,
}) {
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

  let cleanedUpLabel = null;
  if (label) {
    cleanedUpLabel = removeFirstEmojiFromString(label);
  }

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
    return getEditMenuItems();
  }, [getEditMenuItems]);

  const emptyMenu = {
    menuItems: [],
  };

  const onMenuItemPress = useMemo(() => {
    return getOnMenuItemPress(walletId, address, label);
  }, [address, getOnMenuItemPress, label, walletId]);

  const handlePressMenuItem = useCallback(
    e => {
      if (!android) {
        return;
      }

      const buttonIndex = menuConfig.menuItems.findIndex(
        item => item.actionKey === e.nativeEvent.actionKey
      );
      onMenuItemPress(buttonIndex);
    },
    [menuConfig, onMenuItemPress]
  );

  const showIOSMenu = useCallback(() => {
    if (!ios) {
      return;
    }

    showActionSheetWithOptions(
      {
        cancelButtonIndex: 2,
        destructiveButtonIndex: 1,
        options: menuConfig.menuItems.map(item => item.actionTitle),
        title: menuConfig.menuTitle,
      },
      onMenuItemPress
    );
  }, [menuConfig, onMenuItemPress]);

  const content = (
    <Row align="center">
      <Row align="center" flex={1} height={59}>
        {accountImage ? (
          <ImageAvatar image={accountImage} marginRight={10} size="medium" />
        ) : (
          <ContactAvatar
            color={accountColor}
            marginRight={10}
            size="medium"
            value={
              returnStringFirstEmoji(label) ||
              profileUtils.addressHashedEmoji(address) ||
              label ||
              ens
            }
          />
        )}
        <ColumnWithMargins margin={android ? -6 : 3}>
          {cleanedUpLabel || ens ? (
            <StyledTruncatedText
              color={colors.dark}
              testID={`change-wallet-address-row-label-${
                cleanedUpLabel || ens
              }`}
            >
              {cleanedUpLabel || ens}
            </StyledTruncatedText>
          ) : (
            <TruncatedAddress
              address={address}
              color={colors.dark}
              firstSectionLength={6}
              size="smaller"
              style={sx.accountLabel}
              testID={`change-wallet-address-row-address-${address}`}
              truncationLength={4}
              weight="medium"
            />
          )}
          <StyledBottomRowText color={colors.alpha(colors.blueGreyDark, 0.5)}>
            {cleanedUpBalance || 0} ETH
          </StyledBottomRowText>
        </ColumnWithMargins>
      </Row>
      <Column style={sx.rightContent}>
        {isReadOnly && (
          <LinearGradient
            {...linearGradientProps}
            marginRight={editMode || isSelected ? -9 : 19}
          >
            <ReadOnlyText color={colors.alpha(colors.blueGreyDark, 0.5)}>
              {lang.t('wallet.change_wallet.watching')}
            </ReadOnlyText>
          </LinearGradient>
        )}
        {!editMode && isSelected && (
          <CoinCheckButton style={sx.coinCheckIcon} toggle={isSelected} />
        )}
        {editMode &&
          (android ? (
            <ContextMenuButton
              isAnchoredToRight
              menuConfig={editMode ? menuConfig : emptyMenu}
              onPressMenuItem={handlePressMenuItem}
            >
              <OptionsIcon onPress={NOOP} />
            </ContextMenuButton>
          ) : (
            <OptionsIcon onPress={NOOP} />
          ))}
      </Column>
    </Row>
  );

  return (
    <View style={sx.accountRow}>
      {ios ? (
        <ButtonPressAnimation
          enableHapticFeedback={!editMode}
          onLongPress={!watchOnly ? showIOSMenu : onPress}
          onPress={editMode ? showIOSMenu : onPress}
          scaleTo={editMode ? 1 : 0.98}
        >
          {content}
        </ButtonPressAnimation>
      ) : !editMode ? (
        <ButtonPressAnimation
          enableHapticFeedback={!editMode}
          onPress={onPress}
          scaleTo={0.98}
        >
          {content}
        </ButtonPressAnimation>
      ) : (
        content
      )}
    </View>
  );
}
