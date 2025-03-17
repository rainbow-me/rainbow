import * as i18n from '@/languages';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import CaretImageSource from '@/assets/family-dropdown-arrow.png';
import { AnimatedText, Inline, Text, useForegroundColor } from '@/design-system';
import { useCollectiblesContext } from '../CollectiblesContext';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import Animated, { useAnimatedStyle, Easing, withTiming } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { CollectionHeaderIcon } from './CollectionHeaderIcon';
import { useLegacyNFTs } from '@/resources/nfts';
import { useAccountSettings } from '@/hooks';
import { useNftSort } from '@/hooks/useNFTsSortBy';
import { groupBy } from 'lodash';

const AnimatedImgixImage = Animated.createAnimatedComponent(Image);

export const TokenFamilyHeaderAnimationDuration = 200;
export const TokenFamilyHeaderHeight = 50;

type Props = {
  name: string;
  isSpecialCollection?: boolean;
};

function CollectionBalance({ collectionName, isSpecialCollection }: { collectionName: string; isSpecialCollection?: boolean }) {
  const { accountAddress } = useAccountSettings();
  const { nftSort, nftSortDirection } = useNftSort();
  const { openedCollections } = useCollectiblesContext();

  const { data: collection = [] } = useLegacyNFTs({
    address: accountAddress,
    sortBy: nftSort,
    sortDirection: nftSortDirection,
    config: {
      enabled: !isSpecialCollection,
      select(data) {
        return groupBy(data.nfts, token => token.familyName)[collectionName] || [];
      },
    },
  });

  const amountStyles = useAnimatedStyle(() => {
    const isOpen = openedCollections.value[collectionName.toLowerCase()];

    return {
      opacity: withTiming(isOpen ? 0 : 1, TIMING_CONFIGS.fadeConfig),
    };
  });

  const total = useMemo(() => {
    return !isSpecialCollection ? `${collection.length}` : undefined;
  }, [collection, isSpecialCollection]);

  if (isSpecialCollection) return null;

  return (
    <AnimatedText style={[amountStyles, { paddingRight: 4 }]} size="20pt" color="label" weight="regular">
      {total}
    </AnimatedText>
  );
}

export function CollectionHeader({ name, isSpecialCollection }: Props) {
  const { accountAddress } = useAccountSettings();
  const { openedCollections, toggleCollection } = useCollectiblesContext();
  const { nftSort, nftSortDirection } = useNftSort();
  const caretColor = useForegroundColor('label');
  const hiddenColor = useForegroundColor('labelTertiary');
  const isHidden = name === i18n.t(i18n.l.button.hidden);
  const isShowcase = name === i18n.t(i18n.l.account.tab_showcase);

  // Only fetch collection data for regular collections
  const { data: collectionInfo } = useLegacyNFTs({
    address: accountAddress,
    sortBy: nftSort,
    sortDirection: nftSortDirection,
    config: {
      // Skip fetching for special collections to reduce unnecessary renders
      enabled: !isSpecialCollection,
      select(data) {
        const collections = groupBy(data.nfts, token => token.familyName);
        return collections[name] ? collections[name][0] : null;
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

  // Get image based on collection type
  const getImageForCollection = () => {
    if (isSpecialCollection) {
      if (isShowcase) return '🏆'; // Trophy emoji for showcase
      if (isHidden) return 'hidden' as const; // Special value for hidden
      return undefined;
    }

    return collectionInfo?.familyImage;
  };

  return (
    <GestureHandlerButton onPressWorklet={handlePress} scaleTo={1.05}>
      <View style={[sx.content]}>
        <View style={[sx.center]}>
          <CollectionHeaderIcon image={getImageForCollection()} name={name} />
        </View>
        <View style={[sx.title, { paddingLeft: 10 }]}>
          <Text color={isHidden ? 'labelTertiary' : 'label'} numberOfLines={1} size="18px / 27px (Deprecated)" weight="heavy">
            {name}
          </Text>
        </View>
        <Inline horizontalSpace={'8px'} alignVertical="center">
          <CollectionBalance collectionName={name} isSpecialCollection={isSpecialCollection} />
          <AnimatedImgixImage source={CaretImageSource} tintColor={isHidden ? hiddenColor : caretColor} style={[caretStyles, sx.chevron]} />
        </Inline>
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
    marginBottom: 1,
    right: 5,
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
