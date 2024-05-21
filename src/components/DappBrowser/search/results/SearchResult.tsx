import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Source } from 'react-native-fast-image';
import Animated, { SharedValue, useAnimatedProps, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import GoogleSearchIcon from '@/assets/googleSearchIcon.png';
import { AnimatedFasterImage } from '@/components/AnimatedComponents/AnimatedFasterImage';
import { ButtonPressAnimation } from '@/components/animations';
import { ImgixImage } from '@/components/images';
import { DEFAULT_FASTER_IMAGE_CONFIG } from '@/components/images/ImgixImage';
import { AnimatedText, Box, Inline, Stack, Text, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { useDimensions } from '@/hooks';
import { Dapp } from '@/resources/metadata/dapps';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { useSearchContext } from '../SearchContext';
import * as i18n from '@/languages';

export const SearchResult = ({ index, goToUrl }: { index: number; goToUrl: (url: string) => void }) => {
  const { searchResults } = useSearchContext();
  const { isDarkMode } = useColorMode();
  const { width: deviceWidth } = useDimensions();

  const dapp: SharedValue<Dapp | undefined> = useDerivedValue(() => searchResults?.value[index]);
  const name: SharedValue<string | undefined> = useDerivedValue(() => dapp.value?.name);
  const url: SharedValue<string | undefined> = useDerivedValue(() => dapp.value?.url);
  const urlDisplay: SharedValue<string | undefined> = useDerivedValue(() => dapp.value?.urlDisplay);

  const animatedIconSource = useAnimatedProps(() => {
    return {
      source: {
        ...DEFAULT_FASTER_IMAGE_CONFIG,
        url: dapp.value?.iconUrl ?? '',
      },
    };
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      display: dapp.value ? 'flex' : 'none',
    };
  });

  const separatorSecondary = useForegroundColor('separatorSecondary');
  const separatorTertiary = useForegroundColor('separatorTertiary');

  const onPress = useCallback(() => url.value && goToUrl(url.value), [goToUrl, url.value]);

  const fallbackIconStyle = useAnimatedStyle(() => {
    return { display: dapp.value?.iconUrl ? 'none' : 'flex' };
  });
  return (
    <Animated.View style={animatedStyle}>
      <Box
        as={ButtonPressAnimation}
        padding={{ custom: 8 - THICK_BORDER_WIDTH }}
        borderRadius={18}
        background={index === 0 ? 'fill' : undefined}
        scaleTo={0.95}
        onPress={onPress}
        style={
          index === 0
            ? {
                borderWidth: THICK_BORDER_WIDTH,
                borderColor: isDarkMode ? separatorSecondary : separatorTertiary,
                borderCurve: 'continuous',
                overflow: 'hidden',
              }
            : {}
        }
      >
        <Inline space="12px" alignVertical="center" wrap={false}>
          <Box width={{ custom: 40 }} height={{ custom: 40 }}>
            <Box style={styles.iconContainer}>
              <Animated.View style={[{ width: 40, height: 40, justifyContent: 'center' }, fallbackIconStyle]}>
                <AnimatedText color="labelQuaternary" size="icon 28px" weight="black" staticText="􀎭" align="center" />
              </Animated.View>
              {/* ⚠️ TODO: This works but we should figure out how to type this correctly to avoid this error */}
              {/* @ts-expect-error: Doesn't pick up that it's getting a source prop via animatedProps */}
              <AnimatedFasterImage animatedProps={animatedIconSource} style={styles.iconImage} />
            </Box>
          </Box>
          <Box width={{ custom: deviceWidth - 100 }}>
            <Stack space="10px">
              <AnimatedText size="17pt" weight="bold" color="label" numberOfLines={1}>
                {name}
              </AnimatedText>
              <AnimatedText size="13pt" weight="bold" color="labelTertiary" numberOfLines={1}>
                {urlDisplay}
              </AnimatedText>
            </Stack>
          </Box>
        </Inline>
      </Box>
    </Animated.View>
  );
};

const searchText = i18n.t(i18n.l.dapp_browser.search.search);

export const GoogleSearchResult = ({ goToUrl }: { goToUrl: (url: string) => void }) => {
  const { searchQuery } = useSearchContext();
  const { width: deviceWidth } = useDimensions();

  const animatedText = useDerivedValue(() => `${searchText} "${searchQuery?.value}"`);

  const onPress = useCallback(
    () => searchQuery && goToUrl(`https://www.google.com/search?q=${encodeURIComponent(searchQuery.value)}`),
    [goToUrl, searchQuery]
  );

  return (
    <Box as={ButtonPressAnimation} padding="8px" borderRadius={18} scaleTo={0.95} onPress={onPress}>
      <Inline space="12px" alignVertical="center" wrap={false}>
        <Box
          alignItems="center"
          justifyContent="center"
          style={{ backgroundColor: globalColors.white100 }}
          width={{ custom: 40 }}
          height={{ custom: 40 }}
          borderRadius={10}
        >
          <ImgixImage source={GoogleSearchIcon as Source} style={{ width: 30, height: 30 }} size={30} />
        </Box>
        <Box width={{ custom: deviceWidth - 100 }}>
          <Stack space="10px">
            <AnimatedText size="17pt" weight="bold" color="label" numberOfLines={1}>
              {animatedText}
            </AnimatedText>
            <Text size="13pt" weight="bold" color="labelTertiary">
              Google
            </Text>
          </Stack>
        </Box>
      </Inline>
    </Box>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    borderCurve: 'continuous',
    borderRadius: 10,
    overflow: 'hidden',
  },
  iconImage: {
    height: '100%',
    width: '100%',
  },
});
