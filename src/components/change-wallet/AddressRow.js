import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { removeFirstEmojiFromString } from '../../helpers/emojiHandler';
import { deviceUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText } from '../coin-row';
import CoinCheckButton from '../coin-row/CoinCheckButton';
import { ContactAvatar } from '../contacts';
import ImageAvatar from '../contacts/ImageAvatar';
import { Icon } from '../icons';
import { Centered, Column, ColumnWithMargins, Row } from '../layout';
import { TruncatedAddress, TruncatedText } from '../text';
import { colors, fonts, getFontSize } from '@rainbow-me/styles';

const maxAccountLabelWidth = deviceUtils.dimensions.width - 88;
const NOOP = () => undefined;

const sx = StyleSheet.create({
  accountLabel: {
    color: colors.dark,
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
    color: colors.alpha(colors.blueGreyDark, 0.5),
    fontWeight: fonts.weight.medium,
    letterSpacing: fonts.letterSpacing.roundedMedium,
  },
  coinCheckIcon: {
    width: 60,
  },
  editIcon: {
    color: colors.appleBlue,
    fontFamily: fonts.family.SFProRounded,
    fontSize: getFontSize(fonts.size.large),
    fontWeight: fonts.weight.medium,
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
    color: colors.alpha(colors.blueGreyDark, 0.5),
    fontFamily: fonts.family.SFProRounded,
    fontWeight: fonts.weight.semibold,
    letterSpacing: fonts.letterSpacing.roundedTight,
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

const gradientColors = ['#ECF1F5', '#DFE4EB'];
const gradientProps = {
  pointerEvents: 'none',
  style: sx.gradient,
};

const linearGradientProps = {
  ...gradientProps,
  colors: [
    colors.alpha(gradientColors[0], 0.3),
    colors.alpha(gradientColors[1], 0.5),
  ],
  end: { x: 1, y: 1 },
  start: { x: 0, y: 0 },
};

const OptionsIcon = ({ onPress }) => (
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

export default function AddressRow({ data, editMode, onPress, onEditWallet }) {
  const {
    address,
    balance,
    color: accountColor,
    ens,
    image: accountImage,
    index,
    isSelected,
    isReadOnly,
    label,
    walletId,
  } = data;

  let cleanedUpBalance = balance;
  if (balance === '0.00') {
    cleanedUpBalance = '0';
  }

  let cleanedUpLabel = null;
  if (label) {
    cleanedUpLabel = removeFirstEmojiFromString(label).join('');
  }

  const onOptionsPress = useCallback(() => {
    onEditWallet(walletId, address, cleanedUpLabel);
  }, [address, cleanedUpLabel, onEditWallet, walletId]);

  return (
    <View style={sx.accountRow}>
      <ButtonPressAnimation
        enableHapticFeedback={!editMode}
        onLongPress={onOptionsPress}
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
                value={label || ens || `${index + 1}`}
              />
            )}
            <ColumnWithMargins margin={3}>
              {cleanedUpLabel || ens ? (
                <TruncatedText style={sx.accountLabel}>
                  {cleanedUpLabel || ens}
                </TruncatedText>
              ) : (
                <TruncatedAddress
                  address={address}
                  firstSectionLength={6}
                  size="smaller"
                  style={sx.accountLabel}
                  truncationLength={4}
                  weight="medium"
                />
              )}
              <BottomRowText style={sx.bottomRowText}>
                {cleanedUpBalance || 0} ETH
              </BottomRowText>
            </ColumnWithMargins>
          </Row>
          <Column style={sx.rightContent}>
            {isReadOnly && (
              <LinearGradient
                {...linearGradientProps}
                marginRight={editMode || isSelected ? -9 : 19}
              >
                <Text style={sx.readOnlyText}>Watching</Text>
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
