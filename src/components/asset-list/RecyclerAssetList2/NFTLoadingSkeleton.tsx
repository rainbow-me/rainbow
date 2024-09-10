import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useForegroundColor } from '@/design-system';
import { useTheme } from '@/theme';
import { opacity } from '@/__swaps__/utils/swaps';
import { deviceUtils } from '@/utils';
import { NFTS_ENABLED, useExperimentalFlag } from '@/config';
import { useRemoteConfig } from '@/model/remoteConfig';

export const TokenFamilyHeaderHeight = 50;

const getRandomBetween = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
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
            { backgroundColor: opacity(labelTertiary, 0.08), width: deviceUtils.dimensions.width / getRandomBetween(1.8, 3) },
          ]}
        />
      </View>
    </View>
  );
};

const NFTLoadingSkeleton = ({ items = 5 }) => {
  const { nfts_enabled } = useRemoteConfig();
  const nftsEnabled = useExperimentalFlag(NFTS_ENABLED) || nfts_enabled;

  if (!nftsEnabled) return null;

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
    gap: 5,
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
    height: 14,
    borderRadius: 7,
    paddingRight: 9,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TokenFamilyHeaderHeight,
    padding: 19,
    width: '100%',
  },
});

export default NFTLoadingSkeleton;
