import { ButtonPressAnimation } from '@/components/animations';
import { Page } from '@/components/layout';
import { Bleed, Box, Inline, Inset, Stack, Text } from '@/design-system';
import { useNavigation } from '@/navigation';
import { getHeaderHeight } from '@/navigation/SwipeNavigator';
import { safeAreaInsetValues } from '@/utils';
import React from 'react';
import { ScrollView } from 'react-native';

const Card = () => {
  return (
    <ButtonPressAnimation>
      <Box
        borderRadius={24}
        shadow="18px"
        background="surfacePrimary"
        width={{ custom: 166.5 }}
        height={{ custom: 137 }}
        padding="20px"
        justifyContent="space-between"
        style={{ borderWidth: 1.33, borderColor: 'rgba(255, 255, 255, 0.12)' }}
      >
        <Box
          background="blue"
          shadow="18px"
          width={{ custom: 48 }}
          height={{ custom: 48 }}
          top={{ custom: -8 }}
          left={{ custom: -8 }}
          borderRadius={12}
        />
        <Stack space="10px">
          <Text size="17pt" weight="heavy" color="label">
            Rainbowcast
          </Text>
          <Text size="13pt" weight="bold" color="labelTertiary">
            zora.co
          </Text>
        </Stack>
      </Box>
    </ButtonPressAnimation>
  );
};

export default function DappBrowserScreen() {
  const { navigate } = useNavigation();

  return (
    <Box as={Page} flex={1} height="full" width="full" justifyContent="center">
      <ScrollView
        scrollIndicatorInsets={{
          bottom: getHeaderHeight() - safeAreaInsetValues.bottom,
        }}
        contentContainerStyle={{
          paddingBottom: getHeaderHeight() + 32,
          paddingTop: 100, // change this
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator
      >
        <Stack space="20px">
          <Inline alignVertical="center" space="6px">
            <Text color="red" size="15pt" align="center" weight="heavy">
              􀙭
            </Text>
            <Text color="label" size="20pt" weight="heavy">
              Trending
            </Text>
          </Inline>
          <Bleed space="20px">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Inset space="20px">
                <Inline space="12px">
                  <Card />
                  <Card />
                  <Card />
                </Inline>
              </Inset>
            </ScrollView>
          </Bleed>
        </Stack>
      </ScrollView>
    </Box>
  );
}
