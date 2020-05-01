/* eslint-disable sort-keys */
import GraphemeSplitter from 'grapheme-splitter';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { removeFirstEmojiFromString } from '../../helpers/emojiHandler';
import { colors, fonts } from '../../styles';
import { ButtonPressAnimation } from '../animations';

const avatarSize = 30;
const sx = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 7.5,
    paddingRight: 15,
  },
  walletName: {
    color: colors.dark,
    fontFamily: fonts.family.SFProText,
    fontSize: Number(fonts.size.large.replace('px', '')),
    fontWeight: fonts.weight.semibold,
    marginTop: 5,
  },
  avatarCircle: {
    borderRadius: 20,
    marginLeft: 8,
    marginRight: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  firstLetter: {
    textAlign: 'center',
    color: colors.white,
    fontWeight: '600',
  },
  leftSide: {
    flexDirection: 'row',
  },
});

export default function WalletRow({
  accountColor,
  accountName,
  id,
  onEditWallet,
}) {
  const onLongPress = useCallback(() => {
    onEditWallet(id);
  }, [id, onEditWallet]);

  const name = accountName ? removeFirstEmojiFromString(accountName) : '';

  return (
    <ButtonPressAnimation scaleTo={0.98}>
      <TouchableWithoutFeedback onLongPress={onLongPress}>
        <View style={[sx.container, { padding: 10 }]}>
          <View style={sx.leftSide}>
            <View
              style={[
                sx.avatarCircle,
                {
                  backgroundColor:
                    colors.avatarColor[accountColor] || colors.white,
                  height: avatarSize,
                  width: avatarSize,
                },
              ]}
            >
              <Text
                style={[
                  sx.firstLetter,
                  {
                    fontSize: 16,
                    lineHeight: 30.5,
                    marginLeft: 0.2,
                  },
                ]}
              >
                {new GraphemeSplitter().splitGraphemes(accountName)[0]}
              </Text>
            </View>
            <View>
              <Text style={sx.walletName}>{name}</Text>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ButtonPressAnimation>
  );
}

WalletRow.propTypes = {
  accountColor: PropTypes.number.isRequired,
  accountName: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  onEditWallet: PropTypes.func,
};
