import { Box, Inline, Inset, Stack, Text, TextIcon } from '@/design-system';
import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { ButtonPressAnimation } from '../../animations';
import { ImgixImage } from '../../images';
import { useBrowserContext } from '../BrowserContext';

const SearchResult = ({ suggested }: { suggested?: boolean }) => {
  return (
    <Box as={ButtonPressAnimation} padding="8px" borderRadius={18} background={suggested ? 'fill' : undefined}>
      <Inline space="12px" alignVertical="center">
        <Box
          as={ImgixImage}
          source={{ uri: 'https://pbs.twimg.com/profile_images/1741494128779886592/RY4V0T2F_400x400.jpg' }}
          size={48}
          background="surfacePrimary"
          shadow="24px"
          width={{ custom: 40 }}
          height={{ custom: 40 }}
          borderRadius={10}
        />
        <Stack space="10px">
          <Text size="17pt" weight="bold" color="label">
            Uniswap
          </Text>
          <Text size="13pt" weight="bold" color="labelTertiary">
            app.uniswap.org
          </Text>
        </Stack>
      </Inline>
    </Box>
  );
};

export const SearchResults = () => {
  const { searchViewProgress, searchInputRef, tabViewProgress } = useBrowserContext();
  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: searchViewProgress?.value,
    pointerEvents: (tabViewProgress?.value ?? 0) < 1 ? 'box-none' : 'none',
  }));

  return (
    <Box as={Animated.View} height="full" width="full" position="absolute" background="surfacePrimary" style={[backgroundStyle]}>
      <Inset horizontal="16px" top={{ custom: 100 }}>
        <Stack space="32px">
          <Stack space="12px">
            <Inset horizontal="8px">
              <Inline alignHorizontal="justify" alignVertical="center">
                <Inline space="6px" alignVertical="center">
                  <TextIcon color="blue" size="15pt" weight="heavy">
                    􀐫
                  </TextIcon>
                  <Text weight="heavy" color="label" size="20pt">
                    Suggested
                  </Text>
                </Inline>
                <Box
                  as={ButtonPressAnimation}
                  background="fill"
                  height={{ custom: 32 }}
                  width={{ custom: 32 }}
                  borderRadius={32}
                  alignItems="center"
                  justifyContent="center"
                  onPress={() => searchInputRef?.current?.blur()}
                >
                  <Text weight="heavy" color="label" size="15pt" align="center">
                    􀆄
                  </Text>
                </Box>
              </Inline>
            </Inset>
            <SearchResult suggested />
          </Stack>
          <Stack space="12px">
            <Inset horizontal="8px">
              <Inline space="6px" alignVertical="center">
                <TextIcon color="labelSecondary" size="15pt" weight="heavy">
                  􀊫
                </TextIcon>
                <Text weight="heavy" color="label" size="20pt">
                  More Results
                </Text>
              </Inline>
            </Inset>
            <Stack space="4px">
              <SearchResult />
              <SearchResult />
              <SearchResult />
            </Stack>
          </Stack>
        </Stack>
      </Inset>
    </Box>
  );
};
