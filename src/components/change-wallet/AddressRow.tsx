import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText } from '../coin-row';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../coin-row/CoinCheckButton' was resolved ... Remove this comment to see the full error message
import CoinCheckButton from '../coin-row/CoinCheckButton';
import { ContactAvatar } from '../contacts';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../contacts/ImageAvatar' was resolved to '... Remove this comment to see the full error message
import ImageAvatar from '../contacts/ImageAvatar';
import { Icon } from '../icons';
import { Centered, Column, ColumnWithMargins, Row } from '../layout';
import { Text, TruncatedAddress, TruncatedText } from '../text';
import {
  removeFirstEmojiFromString,
  returnStringFirstEmoji,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/emojiHandl... Remove this comment to see the full error message
} from '@rainbow-me/helpers/emojiHandler';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts, fontWithWidth, getFontSize } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
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
    paddingVertical: 1,
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

const OptionsIcon = ({ onPress }: any) => {
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation onPress={onPress} scaleTo={0.9}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered height={40} width={60}>
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        {android ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Icon circle color={colors.appleBlue} name="threeDots" tightDots />
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
}: any) {
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

  let cleanedUpLabel: any = null;
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <View style={sx.accountRow}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonPressAnimation
        enableHapticFeedback={!editMode}
        onLongPress={!watchOnly ? onOptionsPress : onPress}
        onPress={editMode ? onOptionsPress : onPress}
        scaleTo={editMode ? 1 : 0.98}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Row align="center">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Row align="center" flex={1} height={59}>
            {accountImage ? (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <ImageAvatar
                image={accountImage}
                marginRight={10}
                size="medium"
              />
            ) : (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <ColumnWithMargins margin={android ? -6 : 3}>
              {cleanedUpLabel || ens ? (
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <StyledTruncatedText color={colors.dark}>
                  {cleanedUpLabel || ens}
                </StyledTruncatedText>
              ) : (
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <StyledBottomRowText
                color={colors.alpha(colors.blueGreyDark, 0.5)}
              >
                {cleanedUpBalance || 0} ETH
              </StyledBottomRowText>
            </ColumnWithMargins>
          </Row>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Column style={sx.rightContent}>
            {isReadOnly && (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <LinearGradient
                {...linearGradientProps}
                // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
                marginRight={editMode || isSelected ? -9 : 19}
              >
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <ReadOnlyText color={colors.alpha(colors.blueGreyDark, 0.5)}>
                  Watching
                </ReadOnlyText>
              </LinearGradient>
            )}
            {!editMode && isSelected && (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <CoinCheckButton style={sx.coinCheckIcon} toggle={isSelected} />
            )}
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            {editMode && <OptionsIcon onPress={NOOP} />}
          </Column>
        </Row>
      </ButtonPressAnimation>
    </View>
  );
}
