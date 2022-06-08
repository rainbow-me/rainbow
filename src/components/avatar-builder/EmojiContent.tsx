import React, { useMemo } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { getBrand } from 'react-native-device-info';
import { TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import { charFromEmojiObject } from './helpers/charFromEmojiObject';
import { AllEmojiContentEntry } from './helpers/getFormattedAllEmojiList';
import { EmojiEntry } from './types';
import { useTheme } from '@rainbow-me/theme';
import { deviceUtils } from '@rainbow-me/utils';

const { width } = Dimensions.get('screen');

type Props = AllEmojiContentEntry & {
  columns: number;
  columnSize: number;
  onEmojiSelect: (emoji: EmojiEntry) => void;
};

const EmojiContent = ({ data, columns, columnSize, onEmojiSelect }: Props) => {
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
    <View>
      {categoryEmojis.map(({ rowContent, touchableNet }) => (
        <View key={`categoryEmoji${rowContent[0]}`}>
          <Text
            style={{
              backgroundColor: colors.white,
              color: colors.black,
              fontSize: Math.floor(columnSize) - (ios ? 15 : 22),
              height: (width - 21) / columns,
              letterSpacing: ios ? 8 : getBrand() === 'google' ? 11 : 8,
              marginHorizontal: 10,
              width: deviceUtils.dimensions.width,
            }}
          >
            {rowContent}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              marginHorizontal: 10,
              position: 'absolute',
            }}
          >
            {touchableNet.map(singleLine => {
              const touchableProps = {
                key: `categoryEmojiTouchableOpacity${rowContent[0]}${singleLine.sort_order}`,
                onPress: () => onEmojiSelect(singleLine),
                style: {
                  backgroundColor: colors.white,
                  height: (width - 21) / columns,
                  opacity: 0,
                  width: (width - 21) / columns,
                },
              };
              return ios ? (
                <TouchableOpacity activeOpacity={0.5} {...touchableProps} />
              ) : (
                <GHTouchableOpacity activeOpacity={0.7} {...touchableProps} />
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
};

export default EmojiContent;
