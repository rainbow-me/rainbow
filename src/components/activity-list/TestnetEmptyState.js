import React from 'react';
import { View } from 'react-native';
import { ColumnWithMargins, Centered } from '../layout';
import { Emoji, Br, Text } from '../text';
import { position, colors } from '../../styles';

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
            style={{ lineHeight: 25, textAlign: 'center' }}
          >
            Your testnet transaction <Br />
            history starts now!
          </Text>
        </Centered>
      </ColumnWithMargins>
    </View>
  );
}
