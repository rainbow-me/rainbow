import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import { getBrand } from 'react-native-device-info';
import { useTheme } from '@rainbow-me/theme';
import { deviceUtils, magicMemo } from '@rainbow-me/utils';

const { width } = Dimensions.get('screen');

interface Props {
  columnSize: number;
  emojisRows: string[][];
  columns: number;
}

const InitialEmojis = ({ columnSize, emojisRows, columns }: Props) => {
  const { colors } = useTheme();

  return (
    <View style={{ marginTop: 34 }}>
      {emojisRows.map(emojis => (
        <Text
          key={`emojiRow${emojis[0]}`}
          style={{
            color: colors.black,
            fontSize: Math.floor(columnSize) - (ios ? 15 : 22),
            height: (width - 21) / columns,
            letterSpacing: ios ? 8 : getBrand() === 'google' ? 11 : 8,
            marginHorizontal: 10,
            top: 0.8,
            width: deviceUtils.dimensions.width,
          }}
        >
          {emojis}
        </Text>
      ))}
    </View>
  );
};

export default magicMemo(InitialEmojis, [
  'columnSize',
  'emojisRows',
  'columns',
]);
