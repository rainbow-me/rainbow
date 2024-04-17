import React, { useCallback } from 'react';
import { ImgixImage } from '@/components/images';
import { AnimatedText, Box, Inline, Stack, Text } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { formatUrl, formatUrlWorklet } from '../utils';
import GoogleSearchIcon from '@/assets/googleSearchIcon.png';
import { Source } from 'react-native-fast-image';
import { GetdAppsQuery } from '@/graphql/__generated__/metadata';
import Animated, { SharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { FasterImageView, ImageOptions } from '@candlefinance/faster-image';

const AnimatedFasterImage = Animated.createAnimatedComponent(FasterImageView);

export const SearchResult = ({
  index,
  searchResults,
  navigateToUrl,
}: {
  index: number;
  searchResults: SharedValue<any[]>;
  navigateToUrl: (url: string) => void;
}) => {
  const name: SharedValue<string | undefined> = useDerivedValue(() => searchResults.value[index]?.name);
  const url: SharedValue<string | undefined> = useDerivedValue(() => searchResults.value[index]?.url);
  const formattedUrl: SharedValue<string | undefined> = useDerivedValue(() => url.value && formatUrlWorklet(url.value));
  const iconImageOpts: SharedValue<ImageOptions> = useDerivedValue(() => ({ url: searchResults.value[index]?.iconURL, borderRadius: 10 }));

  const animatedStyle = useAnimatedStyle(() => {
    return {
      display: searchResults.value[index] ? 'flex' : 'none',
    };
  });

  const onPress = useCallback(() => url.value && navigateToUrl(url.value), [navigateToUrl, url.value]);

  return (
    <Animated.View style={animatedStyle}>
      <Box
        as={ButtonPressAnimation}
        padding="8px"
        borderRadius={18}
        background={index === 0 ? 'fill' : undefined}
        scaleTo={0.95}
        onPress={onPress}
      >
        <Inline space="12px" alignVertical="center">
          <Box background="surfacePrimary" shadow="24px" width={{ custom: 40 }} height={{ custom: 40 }} borderRadius={10}>
            <AnimatedFasterImage source={iconImageOpts} style={{ width: '100%', height: '100%' }} />
          </Box>
          <Stack space="10px">
            <AnimatedText size="17pt" weight="bold" color="label">
              {name}
            </AnimatedText>
            <AnimatedText size="13pt" weight="bold" color="labelTertiary">
              {formattedUrl}
            </AnimatedText>
          </Stack>
        </Inline>
      </Box>
    </Animated.View>
  );
};

export const GoogleSearchResult = ({
  searchQuery,
  navigateToUrl,
}: {
  searchQuery: SharedValue<string>;
  navigateToUrl: (url: string) => void;
}) => {
  const onPress = useCallback(() => navigateToUrl(`https://www.google.com/search?q=${searchQuery}`), []);

  const animatedText = useDerivedValue(() => `Search "${searchQuery.value}"`);

  return (
    <Box as={ButtonPressAnimation} padding="8px" borderRadius={18} scaleTo={0.95} onPress={onPress}>
      <Inline space="12px" alignVertical="center">
        <Box
          alignItems="center"
          justifyContent="center"
          background="surfacePrimaryElevated"
          shadow="24px"
          width={{ custom: 40 }}
          height={{ custom: 40 }}
          borderRadius={10}
        >
          <ImgixImage source={GoogleSearchIcon as Source} style={{ width: 30, height: 30 }} size={30} />
        </Box>
        <Stack space="10px">
          <AnimatedText size="17pt" weight="bold" color="label">
            {animatedText}
          </AnimatedText>
          <Text size="13pt" weight="bold" color="labelTertiary">
            Google
          </Text>
        </Stack>
      </Inline>
    </Box>
  );
};
