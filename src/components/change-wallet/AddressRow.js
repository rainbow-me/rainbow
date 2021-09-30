import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText } from '../coin-row';
import CoinCheckButton from '../coin-row/CoinCheckButton';
import { ContactAvatar } from '../contacts';
import ImageAvatar from '../contacts/ImageAvatar';
import { Icon } from '../icons';
import { Centered, Column, ColumnWithMargins, Row } from '../layout';
import { TruncatedAddress, TruncatedText } from '../text';
import {
  removeFirstEmojiFromString,
  returnStringFirstEmoji,
} from '@rainbow-me/helpers/emojiHandler';
import { fonts, fontWithWidth, getFontSize } from '@rainbow-me/styles';
import { deviceUtils, profileUtils } from '@rainbow-me/utils';

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
    height: 24,
    marginLeft: 19,
    textAlign: 'center',
  },
  readOnlyText: {
    fontFamily: fonts.family.SFProRounded,
    fontWeight: fonts.weight.semibold,
    letterSpacing: fonts.letterSpacing.roundedTight,
    lineHeight: 22,
    paddingHorizontal: 6.5,
    paddingVertical: 3,
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

const StyledTruncatedText = styled(TruncatedText)`
  ${sx.accountLabel}
  ${fontWithWidth(sx.accountLabel.fontWeight)}
`;

const StyledBottomRowText = styled(BottomRowText)`
  ${sx.bottomRowText}
  ${fontWithWidth(sx.bottomRowText.fontWeight)}
`;

const ReadOnlyText = styled(Text)`
  ${sx.readOnlyText}
  ${fontWithWidth(sx.readOnlyText.fontWeight)}
`;

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
  onPress,
  onEditWallet,
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

  const { colors } = useTheme();

  let cleanedUpBalance = balance;
  if (balance === '0.00') {
    cleanedUpBalance = '0';
  }

  let cleanedUpLabel = null;
  if (label) {
    cleanedUpLabel = removeFirstEmojiFromString(label);
  }

  const onOptionsPress = useCallback(() => {
    onEditWallet(walletId, address, cleanedUpLabel);
  }, [address, cleanedUpLabel, onEditWallet, walletId]);

  const linearGradientProps = useMemo(
    () => ({
      ...gradientProps,
      colors: [
        colors.alpha(colors.gradients.lightGrey[0], 0.6),
        colors.gradients.lightGrey[1],
      ],
      end: { x: 1, y: 1 },
      start: { x: 0, y: 0 },
    }),
    [colors]
  );

  return (
    <View style={sx.accountRow}>
      <ButtonPressAnimation
        enableHapticFeedback={!editMode}
        onLongPress={!watchOnly ? onOptionsPress : onPress}
        onPress={editMode ? onOptionsPress : onPress}
        scaleTo={editMode ? 1 : 0.98}
      >
        <Row align="center">
          <Row align="center" flex={1} height={59}>
            {accountImage ? (
              <ImageAvatar
                image={accountImage}
                marginRight={10}
                size="medium"
              />
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
                <StyledTruncatedText color={colors.dark}>
                  {cleanedUpLabel || ens}
                </StyledTruncatedText>
              ) : (
                <TruncatedAddress
                  address={address}
                  color={colors.dark}
                  firstSectionLength={6}
                  size="smaller"
                  style={sx.accountLabel}
                  truncationLength={4}
                  weight="medium"
                />
              )}
              <StyledBottomRowText
                color={colors.alpha(colors.blueGreyDark, 0.5)}
              >
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
                <ReadOnlyText
                  style={[
                    sx.readOnlyText,
                    {
                      color: colors.alpha(colors.blueGreyDark, 0.5),
                      ...fontWithWidth(sx.readOnlyText.fontWeight),
                    },
                  ]}
                >
                  Watching
                </ReadOnlyText>
              </LinearGradient>
            )}
            {!editMode && isSelected && (
              <CoinCheckButton style={sx.coinCheckIcon} toggle={isSelected} />
            )}
            {editMode && <OptionsIcon onPress={NOOP} />}
          </Column>
        </Row>
      </ButtonPressAnimation>
    </View>
  );
}
