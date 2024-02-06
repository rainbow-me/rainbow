import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EMOJIS_CONTAINER_HORIZONTAL_MARGIN, EMOJIS_TOP_OFFSET } from './constants';
import { useTheme } from '@/theme';
import { magicMemo } from '@/utils';

interface Props {
  emojisRows: string[][];
  cellSize: number;
  fontSize: number;
}

const InitialEmojis = ({ emojisRows, cellSize, fontSize }: Props) => {
  const { colors } = useTheme();

  return (
    <View style={cx.container}>
      {emojisRows.map(emojis => (
        <View key={`previewEmojiRow${emojis[0]}`} style={[cx.rowContainer, { height: cellSize }]}>
          {emojis.map(emoji => (
            <Text
              key={`previewEmoji${emoji}`}
              style={{
                backgroundColor: colors.white,
                color: colors.black,
                fontSize,
                height: cellSize,
                textAlign: 'center',
                width: cellSize,
              }}
            >
              {emoji}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
};

const cx = StyleSheet.create({
  container: { marginTop: EMOJIS_TOP_OFFSET },
  rowContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: EMOJIS_CONTAINER_HORIZONTAL_MARGIN,
  },
});

export default magicMemo(InitialEmojis, ['columnSize', 'emojisRows', 'columns']);
