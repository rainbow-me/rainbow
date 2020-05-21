import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { removeFirstEmojiFromString } from '../../helpers/emojiHandler';
import { colors, fonts } from '../../styles';
import { getFontSize } from '../../styles/fonts';
import { deviceUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText } from '../coin-row';
import CoinCheckButton from '../coin-row/CoinCheckButton';
import { ContactAvatar } from '../contacts';
import { Row } from '../layout';
import { TruncatedAddress, TruncatedText } from '../text';

const maxAccountLabelWidth = deviceUtils.dimensions.width - 88;

const sx = StyleSheet.create({
  accountLabel: {
    color: colors.dark,
    fontFamily: fonts.family.SFProRounded,
    fontSize: getFontSize(fonts.size.lmedium),
    fontWeight: fonts.weight.medium,
    letterSpacing: fonts.letterSpacing.roundedMedium,
    marginBottom: 3,
    maxWidth: maxAccountLabelWidth,
  },
  accountRow: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 19,
  },
  bottomRowText: {
    color: colors.alpha(colors.blueGreyDark, 0.5),
    fontWeight: fonts.weight.medium,
    letterSpacing: fonts.letterSpacing.roundedMedium,
  },
  coinCheckIcon: {
    right: -9,
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
    <Row paddingTop={8} justify="flex-end" height={40} width={60}>
      <Text style={sx.editIcon}>􀍡</Text>
    </Row>
  </ButtonPressAnimation>
);

export default function AddressRow({ data, editMode, onPress, onEditWallet }) {
  const {
    address,
    balance,
    ens,
    index,
    isSelected,
    isReadOnly,
    label,
    color: accountColor,
    wallet_id,
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
    onEditWallet(wallet_id, address, cleanedUpLabel);
  }, [address, cleanedUpLabel, onEditWallet, wallet_id]);

  return (
    <View style={sx.accountRow}>
      <ButtonPressAnimation
        enableHapticFeedback={!editMode}
        onLongPress={onOptionsPress}
        onPress={onPress}
        scaleTo={editMode ? 1 : 0.98}
      >
        <Row>
          <Row flex={1}>
            <ContactAvatar
              color={accountColor}
              marginRight={10}
              size="medium"
              value={label || ens || `${index + 1}`}
            />
            <View>
              <View>
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
              </View>
              <BottomRowText style={sx.bottomRowText}>
                {cleanedUpBalance} ETH
              </BottomRowText>
            </View>
          </Row>
          <Row>
            {isReadOnly && (
              <LinearGradient
                {...linearGradientProps}
                radius={77}
                marginRight={editMode ? -29 : isSelected ? -9 : 0}
              >
                <Text style={sx.readOnlyText}>Watching</Text>
              </LinearGradient>
            )}
            {!editMode && isSelected && (
              <CoinCheckButton style={sx.coinCheckIcon} toggle={isSelected} />
            )}
            {editMode && <OptionsIcon onPress={onOptionsPress} />}
          </Row>
        </Row>
      </ButtonPressAnimation>
    </View>
  );
}

AddressRow.propTypes = {
  data: PropTypes.object,
  onPress: PropTypes.func,
};
