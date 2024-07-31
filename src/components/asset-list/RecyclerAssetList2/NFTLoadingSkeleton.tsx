import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useForegroundColor } from '@/design-system';
import { useTheme } from '@/theme';
import { opacity } from '@/__swaps__/utils/swaps';
import { deviceUtils } from '@/utils';

export const TokenFamilyHeaderHeight = 50;

const getRandomBetween = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const NFTItem = () => {
  const { colors } = useTheme();
  const labelTertiary = useForegroundColor('labelTertiary');

  return (
    <View
      style={[
        sx.content,
        {
          backgroundColor: colors.white,
        },
      ]}
    >
      <View style={sx.leftContainer}>
        <View
          style={[
            sx.image,
            {
              backgroundColor: opacity(labelTertiary, 0.04),
            },
          ]}
        />
        <View style={sx.textContainer}>
          <View
            style={[
              sx.title,
              { backgroundColor: opacity(labelTertiary, 0.08), width: deviceUtils.dimensions.width / getRandomBetween(2, 4) },
            ]}
          />
        </View>
      </View>
      <View style={sx.rightContainer}>
        <View style={[sx.amount, { backgroundColor: opacity(labelTertiary, 0.14) }]} />
      </View>
    </View>
  );
};

const NFTLoadingSkeleton = ({ items = 5 }) => {
  return (
    <View style={sx.container}>
      {[...Array(items)].map((_, index) => (
        <NFTItem key={index} />
      ))}
    </View>
  );
};

const sx = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    height: 30,
    width: 30,
    borderRadius: 15,
    marginRight: 12,
  },
  textContainer: {
    justifyContent: 'center',
  },
  title: {
    width: deviceUtils.dimensions.width / 2,
    height: 12,
    borderRadius: 4,
    marginBottom: 4,
    paddingRight: 9,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  amount: {
    width: 23,
    height: 16,
    borderRadius: 4,
  },
  chevron: {
    height: 18,
    width: 8,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: TokenFamilyHeaderHeight,
    padding: 19,
    paddingRight: 14,
    width: '100%',
  },
});

export default NFTLoadingSkeleton;
