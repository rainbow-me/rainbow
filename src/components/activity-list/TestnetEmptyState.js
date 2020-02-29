import React from 'react';
import { View, StyleSheet } from 'react-native';
import { position, colors } from '../../styles';
import { ColumnWithMargins, Centered } from '../layout';
import { Emoji, Br, Text } from '../text';

const sx = StyleSheet.create({
  text: {
    lineHeight: 25,
    textAlign: 'center',
  },
});

export default function TestnetEmptyState({ children }) {
  return (
    <View>
      {children}
      <ColumnWithMargins
        {...position.centeredAsObject}
        margin={20}
        marginTop={60}
        paddingBottom={20}
        paddingLeft={70}
        paddingRight={70}
      >
        <Centered>
          <Emoji lineHeight="none" name="ghost" size="h1" />
        </Centered>
        <Centered>
          <Text
            color={colors.alpha(colors.blueGreyDark, 0.4)}
            size="lmedium"
            weight="medium"
            style={sx.text}
          >
            Your testnet transaction <Br />
            history starts now!
          </Text>
        </Centered>
      </ColumnWithMargins>
    </View>
  );
}
