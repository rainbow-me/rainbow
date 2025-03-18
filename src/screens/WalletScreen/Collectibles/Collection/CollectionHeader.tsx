import * as i18n from '@/languages';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import CaretImageSource from '@/assets/family-dropdown-arrow.png';
import { AnimatedText, Box, Inline, Text, useForegroundColor } from '@/design-system';
import { useCollectiblesContext } from '../CollectiblesContext';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import Animated, { useAnimatedStyle, Easing, withTiming, useSharedValue, measure, useAnimatedRef } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { CollectionHeaderIcon } from './CollectionHeaderIcon';
import { useLegacyNFTs } from '@/resources/nfts';
import { useAccountSettings, useHiddenTokens, useShowcaseTokens } from '@/hooks';
import { useNftSort } from '@/hooks/useNFTsSortBy';
import { groupBy } from 'lodash';
import { deviceUtils } from '@/utils';
import { UniqueAsset } from '@/entities';

const AnimatedImgixImage = Animated.createAnimatedComponent(Image);

export const TokenFamilyHeaderAnimationDuration = 200;
export const TokenFamilyHeaderHeight = 50;

type Props = {
  name: string;
  isSpecialCollection?: boolean;
};

const disabledCollectionNames = [i18n.t(i18n.l.account.tab_showcase), i18n.t(i18n.l.button.hidden)];
const STABLE_ARRAY: UniqueAsset[] = [];
const LIST_HORIZONTAL_PADDING = 20;
const COLLECTION_IMAGE_SIZE = 30;
const GAP_BETWEEN_IMAGE_AND_NAME = 12;
const GAP_BETWEEN_BALANCE_AND_ARROW = 8;
const GAP_BETWEEN_NAME_AND_BALANCE = 20;
const ROW_WIDTH =
  deviceUtils.dimensions.width -
  LIST_HORIZONTAL_PADDING -
  GAP_BETWEEN_IMAGE_AND_NAME -
  GAP_BETWEEN_BALANCE_AND_ARROW -
  GAP_BETWEEN_NAME_AND_BALANCE -
  COLLECTION_IMAGE_SIZE;

function CollectionBalance({ collectionName, totalItems }: { collectionName: string; totalItems: number }) {
  const { openedCollections } = useCollectiblesContext();

  const amountStyles = useAnimatedStyle(() => {
    const isOpen = openedCollections.value[collectionName];

    return {
      opacity: withTiming(isOpen ? 0 : 1, TIMING_CONFIGS.fadeConfig),
    };
  });

  const total = useMemo(() => {
    return `${totalItems}`;
  }, [totalItems]);

  return (
    <AnimatedText style={[amountStyles, { paddingRight: 4 }]} size="20pt" color="label" weight="regular">
      {total}
    </AnimatedText>
  );
}

export function CollectionHeader({ name }: Props) {
  const { accountAddress } = useAccountSettings();
  const { openedCollections, toggleCollection } = useCollectiblesContext();
  const { nftSort, nftSortDirection } = useNftSort();
  const { showcaseTokens } = useShowcaseTokens();
  const { hiddenTokens } = useHiddenTokens();

  const balanceRef = useAnimatedRef<Animated.View>();

  const caretColor = useForegroundColor('label');
  const hiddenColor = useForegroundColor('labelTertiary');
  const isHidden = name === i18n.t(i18n.l.button.hidden);
  const isShowcase = name === i18n.t(i18n.l.account.tab_showcase);

  // Only fetch collection data for regular collections
  const { data: uniqueAssets } = useLegacyNFTs({
    address: accountAddress,
    sortBy: nftSort,
    sortDirection: nftSortDirection,
    config: {
      enabled: !disabledCollectionNames.includes(name),
      select(data) {
        if (name === i18n.t(i18n.l.account.tab_showcase)) {
          return data.nfts.filter(token => showcaseTokens.includes(token.uniqueId));
        }
        if (name === i18n.t(i18n.l.button.hidden)) {
          return data.nfts.filter(token => hiddenTokens.includes(token.fullUniqueId));
        }
        const collections = groupBy(data.nfts, token => token.familyName);
        return collections[name] ?? STABLE_ARRAY;
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
          rotate: withTiming(isOpen ? '90deg' : '0deg', TIMING_CONFIGS.buttonPressConfig),
        },
      ],
    };
  });

  const collectionNameStyles = useAnimatedStyle(() => {
    const measured = measure(balanceRef);
    const width = ROW_WIDTH - (measured?.width ?? 32);

    return {
      width: withTiming(width, TIMING_CONFIGS.fadeConfig),
    };
  });

  // Get image based on collection type
  const getImageForCollection = () => {
    if (isShowcase) return '🏆'; // Trophy emoji for showcase
    if (isHidden) return 'hidden' as const; // Special value for hidden

    return uniqueAssets[0]?.familyImage;
  };

  return (
    <GestureHandlerButton disableHaptics onPressWorklet={handlePress} scaleTo={1.05}>
      <Box
        width={deviceUtils.dimensions.width}
        height={{ custom: TokenFamilyHeaderHeight }}
        paddingHorizontal={{ custom: LIST_HORIZONTAL_PADDING }}
        justifyContent="space-between"
      >
        <Inline wrap={false} alignHorizontal="justify" alignVertical="center" horizontalSpace="20px">
          <Box as={Animated.View} flexDirection="row" gap={GAP_BETWEEN_IMAGE_AND_NAME} alignItems="center" style={collectionNameStyles}>
            <CollectionHeaderIcon image={getImageForCollection()} name={name} />
            <Text size="17pt" color={isHidden ? 'labelTertiary' : 'label'} weight="heavy" numberOfLines={1} ellipsizeMode="tail">
              {name}
            </Text>
          </Box>
          <Animated.View style={{ alignItems: 'center', gap: 8, flexDirection: 'row' }}>
            <CollectionBalance collectionName={name} totalItems={uniqueAssets.length} />
            <AnimatedImgixImage
              source={CaretImageSource}
              tintColor={isHidden ? hiddenColor : caretColor}
              style={[
                caretStyles,
                {
                  height: 18,
                  marginBottom: 1,
                  right: 5,
                  width: 8,
                },
              ]}
            />
          </Animated.View>
        </Inline>
      </Box>
    </GestureHandlerButton>
  );
}
