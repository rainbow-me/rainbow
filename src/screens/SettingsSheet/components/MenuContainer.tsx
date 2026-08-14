import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Stack, type Space } from '@/design-system';

interface MenuContainerProps {
  scrollviewRef?: React.RefObject<ScrollView | null>;
  children: React.ReactNode;
  Footer?: React.ReactNode;
  testID?: string;
  space?: Space;
}

const MenuContainer = ({ scrollviewRef, children, testID, Footer, space = '36px' }: MenuContainerProps) => {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          marginBottom: safeAreaInsets.bottom,
          marginTop: Platform.OS === 'ios' ? 12 : undefined,
        },
      ]}
    >
      <ScrollView
        ref={scrollviewRef}
        scrollEventThrottle={32}
        style={[styles.scrollView, Platform.OS === 'ios' && styles.iosScrollView]}
        testID={testID}
      >
        <Box
          paddingHorizontal="19px (Deprecated)"
          // fix clipped shadows on android
          {...(Platform.OS === 'android' && {
            paddingBottom: { custom: 22 },
            paddingTop: { custom: 7 },
          })}
        >
          <Stack space={space}>{children}</Stack>
        </Box>
        {Footer}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iosScrollView: {
    overflow: 'visible',
  },
  scrollView: {
    flex: 1,
  },
});

export default MenuContainer;
