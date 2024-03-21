import { Box, Inline, Inset, Stack, Text, TextIcon } from '@/design-system';
import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { ButtonPressAnimation } from '../../../animations';
import { useBrowserContext } from '../../BrowserContext';
import { SearchResult } from './SearchResult';

export const SearchResults = () => {
  const { searchViewProgress, searchInputRef } = useBrowserContext();
  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: searchViewProgress?.value,
    pointerEvents: searchViewProgress?.value ? 'box-none' : 'none',
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
