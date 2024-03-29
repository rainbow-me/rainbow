import { Box, Inline, Inset, Stack, Text, TextIcon, globalColors, useColorMode } from '@/design-system';
import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { ButtonPressAnimation } from '../../../animations';
import { useBrowserContext } from '../../BrowserContext';
import { SearchResult } from './SearchResult';

export const SearchResults = () => {
  const { searchViewProgress, searchInputRef } = useBrowserContext();
  const { isDarkMode } = useColorMode();

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: searchViewProgress?.value || 0,
    pointerEvents: searchViewProgress?.value ? 'auto' : 'none',
  }));

  return (
    <Box
      as={Animated.View}
      height="full"
      width="full"
      position="absolute"
      style={[backgroundStyle, { backgroundColor: isDarkMode ? globalColors.grey100 : '#FBFCFD' }]}
    >
      <Inset horizontal="16px" top={{ custom: 90 }}>
        <Stack space="32px">
          <Stack space="12px">
            <Inset horizontal="8px">
              <Inline alignHorizontal="justify" alignVertical="center">
                <Inline space="6px" alignVertical="center">
                  <TextIcon color="blue" size="icon 15px" weight="heavy" width={20}>
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
                  right={{ custom: -8 }}
                  justifyContent="center"
                  onPress={() => searchInputRef?.current?.blur()}
                >
                  <Text weight="heavy" color="labelSecondary" size="icon 15px" align="center">
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
                <TextIcon color="labelSecondary" size="icon 15px" weight="heavy" width={20}>
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
