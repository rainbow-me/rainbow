/* eslint-disable sort-keys */
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { removeFirstEmojiFromString } from '../../helpers/emojiHandler';
import { colors, fonts } from '../../styles';
import { getFontSize } from '../../styles/fonts';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText } from '../coin-row';
import CoinCheckButton from '../coin-row/CoinCheckButton';
import { ContactAvatar } from '../contacts';
import { Column, Row } from '../layout';
import { TruncatedAddress } from '../text';

const sx = StyleSheet.create({
  accountLabel: {
    color: colors.dark,
    fontFamily: fonts.family.SFProRounded,
    fontSize: getFontSize(fonts.size.lmedium),
    fontWeight: fonts.weight.medium,
    letterSpacing: fonts.letterSpacing.roundedMedium,
    marginBottom: 3,
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
  leftContent: {
    flexDirection: 'row',
    flex: 1,
  },
  rightContent: {
    flex: 0,
    marginRight: 19,
  },
  coinCheck: {
    alignSelf: 'flex-end',
    backgroundColor: 'red',
    marginRight: 19,
    marginTop: -9,
    width: 22,
  },
  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lightestGrey,
    marginLeft: 19,
    paddingVertical: 10,
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
  gradient: {
    borderRadius: 24,
    height: 24,
    marginTop: 19,
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
  <ButtonPressAnimation
    onPress={onPress}
    scaleTo={0.9}
    style={{
      width: 22,
      height: 22,
      alignSelf: 'flex-end',
      justifyContent: 'center',
    }}
  >
    <View
      style={{
        borderRadius: 22,
        width: 22,
        height: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 45,
      }}
    >
      <Text
        style={{
          color: colors.appleBlue,
          fontFamily: fonts.family.SFProRounded,
          fontSize: getFontSize(fonts.size.large),
          fontWeight: fonts.weight.medium,
          textAlign: 'right',
        }}
      >
        􀍡
      </Text>
    </View>
  </ButtonPressAnimation>
);

export default function AddressRow({
  borderBottom,
  data,
  editMode,
  onPress,
  onEditWallet,
}) {
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
    <View style={[sx.accountRow, borderBottom ? sx.borderBottom : null]}>
      <TouchableWithoutFeedback onLongPress={onOptionsPress}>
        <ButtonPressAnimation onPress={onPress} scaleTo={0.98}>
          <Row>
            <Column style={sx.leftContent}>
              <ContactAvatar
                color={accountColor}
                marginRight={10}
                size="medium"
                value={label || ens || `${index + 1}`}
              />
              <View>
                <View>
                  {cleanedUpLabel || ens ? (
                    <Text style={sx.accountLabel}>{cleanedUpLabel || ens}</Text>
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
            </Column>
            <Column style={sx.rightContent}>
              <View style={sx.coinCheck}>
                {!editMode && isSelected && (
                  <CoinCheckButton toggle={isSelected} isAbsolute />
                )}
              </View>
              {editMode && <OptionsIcon onPress={onOptionsPress} />}
              {!editMode && !isSelected && isReadOnly && (
                <LinearGradient {...linearGradientProps} radius={77}>
                  <Text style={sx.readOnlyText}>Read only</Text>
                </LinearGradient>
              )}
            </Column>
          </Row>
        </ButtonPressAnimation>
      </TouchableWithoutFeedback>
    </View>
  );
}

AddressRow.propTypes = {
  data: PropTypes.object,
  onPress: PropTypes.func,
};
