/* eslint-disable sort-keys */
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
    fontFamily: fonts.family.SFProText,
    fontSize: getFontSize(fonts.size.lmedium),
    fontWeight: fonts.weight.medium,
    paddingBottom: 5,
  },
  accountRow: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 20,
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
    width: 30,
    alignSelf: 'flex-end',
    marginTop: -15,
    backgroundColor: 'red',
    marginRight: 15,
  },
  borderBottom: {
    marginLeft: 20,
    paddingVertical: 10,
    borderColor: colors.lightestGrey,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  readOnlyText: {
    color: colors.mediumGrey,
    fontWeight: fonts.weight.medium,
  },
  gradient: {
    marginTop: 20,
    paddingVertical: 3,
    paddingHorizontal: 8,
    textAlign: 'center',
    borderRadius: 30,
    height: 25,
  },
});

const gradientColors = [colors.lightGrey, colors.blueGreyDark];
const gradientProps = {
  pointerEvents: 'none',
  style: sx.gradient,
};

const linearGradientProps = {
  ...gradientProps,
  end: { x: 1, y: 1 },
  start: { x: 0, y: 0 },
  colors: [
    colors.alpha(gradientColors[0], 0.1),
    colors.alpha(gradientColors[1], 0.08),
  ],
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

  let cleanedUpLabel = null;
  if (label) {
    cleanedUpLabel = removeFirstEmojiFromString(label).join('');
  }

  const onOptionsPress = useCallback(() => {
    onEditWallet(wallet_id, address, cleanedUpLabel);
  }, [address, cleanedUpLabel, onEditWallet, wallet_id]);

  return (
    <View style={[sx.accountRow, borderBottom ? sx.borderBottom : null]}>
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
                    firstSectionLength={6}
                    size="smaller"
                    truncationLength={4}
                    weight="medium"
                    address={address}
                    style={sx.accountLabel}
                  />
                )}
              </View>
              <BottomRowText>{balance} ETH</BottomRowText>
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
              <LinearGradient {...linearGradientProps} radius={81}>
                <Text style={sx.readOnlyText}>Read Only</Text>
              </LinearGradient>
            )}
          </Column>
        </Row>
      </ButtonPressAnimation>
    </View>
  );
}

AddressRow.propTypes = {
  data: PropTypes.object,
  onPress: PropTypes.func,
};
