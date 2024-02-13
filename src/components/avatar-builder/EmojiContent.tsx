import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import { EMOJIS_CONTAINER_HORIZONTAL_MARGIN } from './constants';
import { charFromEmojiObject } from './helpers/charFromEmojiObject';
import { AllEmojiContentEntry } from './helpers/getFormattedAllEmojiList';
import { EmojiEntry } from './types';
import { useTheme } from '@/theme';

type Props = AllEmojiContentEntry & {
  columns: number;
  onEmojiSelect: (emoji: EmojiEntry) => void;
  cellSize: number;
  fontSize: number;
};

const EmojiContent = ({ data, columns, onEmojiSelect, cellSize, fontSize }: Props) => {
  const { colors } = useTheme();

  const categoryEmojis = useMemo(() => {
    let categoryEmojis = [];
    for (let i = 0; i < data.length; i += columns) {
      let rowContent = [];
      let touchableNet = [];
      for (let j = 0; j < columns; j++) {
        if (i + j < data.length) {
          rowContent.push(charFromEmojiObject(data[i + j].emoji));
          touchableNet.push(data[i + j].emoji);
        }
      }
      categoryEmojis.push({
        rowContent,
        touchableNet,
      });
    }
    return categoryEmojis;
  }, [columns, data]);

  return (
    <>
      {categoryEmojis.map(({ rowContent, touchableNet }) => (
        <View key={`categoryEmoji${rowContent[0]}`} style={[cx.rowContainer, { height: cellSize }]}>
          {touchableNet.map((singleLine, index) => {
            const touchableProps = {
              key: `categoryEmojiTouchableOpacity${rowContent[0]}${singleLine.sort_order}`,
              onPress: () => onEmojiSelect(singleLine),
              style: {
                backgroundColor: colors.white,
                height: cellSize,
                width: cellSize,
              },
            };
            return ios ? (
              <TouchableOpacity activeOpacity={0.5} {...touchableProps}>
                <Text
                  style={{
                    backgroundColor: colors.white,
                    color: colors.black,
                    fontSize,
                    height: cellSize,
                    textAlign: 'center',
                    width: cellSize,
                  }}
                >
                  {rowContent[index]}
                </Text>
              </TouchableOpacity>
            ) : (
              <GHTouchableOpacity activeOpacity={0.7} {...touchableProps}>
                <Text
                  style={{
                    backgroundColor: colors.white,
                    color: colors.black,
                    fontSize,
                    height: cellSize,
                    textAlign: 'center',
                    width: cellSize,
                  }}
                >
                  {rowContent[index]}
                </Text>
              </GHTouchableOpacity>
            );
          })}
        </View>
      ))}
    </>
  );
};

const cx = StyleSheet.create({
  rowContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: EMOJIS_CONTAINER_HORIZONTAL_MARGIN,
  },
});

export default EmojiContent;
