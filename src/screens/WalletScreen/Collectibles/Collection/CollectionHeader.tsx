import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import CaretImageSource from '@/assets/family-dropdown-arrow.png';
import { Text, useForegroundColor } from '@/design-system';
import { ImgixImage } from '@/components/images';
import { useCollectiblesContext } from '../CollectiblesContext';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import Animated, { useAnimatedStyle, Easing, withTiming } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { CollectionHeaderIcon } from './CollectionHeaderIcon';
import { useLegacyNFTs } from '@/resources/nfts';
import { useAccountSettings } from '@/hooks';
import { useNftSort } from '@/hooks/useNFTsSortBy';
import { groupBy } from 'lodash';

export const TokenFamilyHeaderAnimationDuration = 200;
export const TokenFamilyHeaderHeight = 50;

type Props = {
  name: string;
};

export function CollectionHeader({ name }: Props) {
  const { nftSort, nftSortDirection } = useNftSort();
  const { accountAddress } = useAccountSettings();
  const { openedCollections, toggleCollection } = useCollectiblesContext();
  const caretColor = useForegroundColor('label');
  const hiddenColor = useForegroundColor('labelTertiary');

  const { data: collection } = useLegacyNFTs({
    address: accountAddress,
    sortBy: nftSort,
    sortDirection: nftSortDirection,
    config: {
      select(data) {
        return groupBy(data.nfts, token => token.familyName)[name];
      },
    },
  });
  const handlePress = useCallback(() => {
    'worklet';
    toggleCollection(name);
  }, [name, toggleCollection]);

  const caretStyles = useAnimatedStyle(() => {
    const isOpen = openedCollections.value[name];
    return {
      transform: [
        {
          rotate: withTiming(isOpen ? '90deg' : '0deg', {
            duration: TokenFamilyHeaderAnimationDuration,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
        },
      ],
    };
  });

  const amountStyles = useAnimatedStyle(() => {
    const isOpen = openedCollections.value[name];

    return {
      opacity: withTiming(isOpen ? 0 : 1, TIMING_CONFIGS.fadeConfig),
    };
  });

  if (!collection?.[0]?.familyImage) return null;

  const { familyImage } = collection[0];

  return (
    <GestureHandlerButton onPressWorklet={handlePress} scaleTo={1.05}>
      <View style={[sx.content]}>
        <View style={[sx.center]}>
          <CollectionHeaderIcon image={familyImage} name={name} />
        </View>
        <View style={[sx.title, { paddingLeft: 10 }]}>
          <Text
            color={name === lang.t('button.hidden') ? 'labelTertiary' : 'label'}
            numberOfLines={1}
            size="18px / 27px (Deprecated)"
            weight="heavy"
          >
            {name}
          </Text>
        </View>
        <View style={[sx.center, sx.amountContainer]}>
          <Animated.View style={amountStyles}>
            <Text align="right" color={name === lang.t('button.hidden') ? 'labelTertiary' : 'label'} size="18px / 27px (Deprecated)">
              {collection.length}
            </Text>
          </Animated.View>
          <Animated.View style={caretStyles}>
            <FastImage
              resizeMode={ImgixImage.resizeMode.contain}
              source={CaretImageSource}
              style={sx.chevron}
              tintColor={name === lang.t('button.hidden') ? hiddenColor : caretColor}
            />
          </Animated.View>
        </View>
      </View>
    </GestureHandlerButton>
  );
}

const sx = StyleSheet.create({
  amountContainer: {
    marginRight: 10,
  },
  center: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  chevron: {
    height: 18,
    width: 8,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    height: TokenFamilyHeaderHeight,
    justifyContent: 'space-between',
    padding: 19,
    paddingRight: 14,
    width: '100%',
  },
  title: {
    flex: 1,
    paddingRight: 9,
  },
});
