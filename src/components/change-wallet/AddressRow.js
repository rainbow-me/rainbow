/* eslint-disable sort-keys */
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { colors, fonts } from '../../styles';
import { abbreviations } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import CoinCheckButton from '../coin-row/CoinCheckButton';
import { Column, Row } from '../layout';
import { TruncatedAddress } from '../text';

const sx = StyleSheet.create({
  accountLabel: {
    color: colors.dark,
    fontFamily: fonts.family.SFProText,
    fontSize: Number(fonts.size.smedium.replace('px', '')),
    fontWeight: fonts.weight.medium,
  },
  addressAbbreviation: {
    fontFamily: fonts.family.SFProText,
    opacity: 0.5,
    textTransform: 'lowercase',
    width: '100%',
  },
  accountRow: {
    marginLeft: 0,
  },
  subItem: {
    marginLeft: 15,
  },
  rightContent: {
    marginLeft: 60,
  },
  coinCheck: {
    marginTop: -15,
  },
  isOnlyAddress: {
    paddingTop: 15,
  },
});

export default function AddressRow({ data, onPress, onEditAddress }) {
  const { address, index, isOnlyAddress, isSelected, label, wallet_id } = data;

  const onLongPress = useCallback(() => {
    onEditAddress(wallet_id, address);
  }, [address, onEditAddress, wallet_id]);

  return (
    <View
      style={[
        sx.subItem,
        sx.accountRow,
        isOnlyAddress ? sx.isOnlyAddress : null,
      ]}
    >
      <ButtonPressAnimation scaleTo={0.98}>
        <TouchableWithoutFeedback onPress={onPress} onLongPress={onLongPress}>
          <Row>
            <Column>
              <View style={sx.coinCheck}>
                <CoinCheckButton toggle={isSelected} isAbsolute />
              </View>
            </Column>
            <Column>
              <View style={sx.rightContent}>
                <View>
                  <Text style={sx.accountLabel}>
                    {label || `Account ${index + 1}`}
                  </Text>
                </View>
                <TruncatedAddress
                  firstSectionLength={abbreviations.defaultNumCharsPerSection}
                  size="smaller"
                  truncationLength={4}
                  weight="medium"
                  address={address}
                  style={sx.addressAbbreviation}
                />
              </View>
            </Column>
          </Row>
        </TouchableWithoutFeedback>
      </ButtonPressAnimation>
    </View>
  );
}

AddressRow.propTypes = {
  data: PropTypes.object,
  onPress: PropTypes.func,
};
