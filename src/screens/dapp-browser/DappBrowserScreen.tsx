import { ButtonPressAnimation } from '@/components/animations';
import { Page } from '@/components/layout';
import { AccentColorProvider, Bleed, Box, Inline, Inset, Stack, Text } from '@/design-system';
import { useNavigation } from '@/navigation';
import { getHeaderHeight } from '@/navigation/SwipeNavigator';
import { deviceUtils, safeAreaInsetValues } from '@/utils';
import React from 'react';
import { ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { useTheme } from '@/theme';

const HORIZONTAL_INSET = 24;

const NUM_LOGOS = 5;
const LOGO_PADDING = 14;
const LOGO_SIZE = (deviceUtils.dimensions.width - HORIZONTAL_INSET * 2 - (NUM_LOGOS - 1) * LOGO_PADDING) / NUM_LOGOS;

const NUM_CARDS = 2;
const CARD_PADDING = 12;
const CARD_WIDTH = (deviceUtils.dimensions.width - HORIZONTAL_INSET * 2 - (NUM_CARDS - 1) * CARD_PADDING) / NUM_CARDS;

const Card = () => {
  const { isDarkMode } = useTheme();

  return (
    <ButtonPressAnimation>
      <Box
        as={LinearGradient}
        colors={['#0078FF', '#3AB8FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        borderRadius={24}
        shadow="18px"
        width={{ custom: CARD_WIDTH }}
        height={{ custom: 137 }}
        padding="20px"
        justifyContent="space-between"
        style={{ borderWidth: 1.33, borderColor: 'rgba(255, 255, 255, 0.12)' }}
        background="blue"
      >
        <Box
          background="blue"
          shadow="24px"
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
        <AccentColorProvider color="rgba(244, 248, 255, 0.08)">
          <Box
            position="absolute"
            background="accent"
            top={{ custom: 12 }}
            right={{ custom: 12 }}
            height={{ custom: 24 }}
            width={{ custom: 24 }}
            borderRadius={32}
            style={{ flex: 1, overflow: 'hidden' }}
          >
            <BlurView
              blurType={isDarkMode ? 'chromeMaterialDark' : 'light'}
              blurAmount={8.5}
              style={{
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            />
          </Box>
        </AccentColorProvider>
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
          paddingHorizontal: HORIZONTAL_INSET,
        }}
        showsVerticalScrollIndicator
      >
        <Stack space="44px">
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
                  <Inline space={{ custom: CARD_PADDING }}>
                    <Card />
                    <Card />
                    <Card />
                  </Inline>
                </Inset>
              </ScrollView>
            </Bleed>
          </Stack>
          <Stack space="20px">
            <Inline alignVertical="center" space="6px">
              <Text color="yellow" size="15pt" align="center" weight="heavy">
                􀋃
              </Text>
              <Text color="label" size="20pt" weight="heavy">
                Favorites
              </Text>
            </Inline>
            <Bleed space="20px">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Inset space="20px">
                  <Inline space={{ custom: LOGO_PADDING }}>
                    <Box
                      width={{ custom: LOGO_SIZE }}
                      height={{ custom: LOGO_SIZE }}
                      borderRadius={15}
                      background="blue"
                      shadow="24px"
                      style={{ borderWidth: 1.33, borderColor: 'rgba(255, 255, 255, 0.1)' }}
                    />
                    <Box width={{ custom: LOGO_SIZE }} height={{ custom: LOGO_SIZE }} borderRadius={15} background="blue" shadow="24px" />
                    <Box width={{ custom: LOGO_SIZE }} height={{ custom: LOGO_SIZE }} borderRadius={15} background="blue" shadow="24px" />
                    <Box width={{ custom: LOGO_SIZE }} height={{ custom: LOGO_SIZE }} borderRadius={15} background="blue" shadow="24px" />
                    <Box width={{ custom: LOGO_SIZE }} height={{ custom: LOGO_SIZE }} borderRadius={15} background="blue" shadow="24px" />
                    <Box width={{ custom: LOGO_SIZE }} height={{ custom: LOGO_SIZE }} borderRadius={15} background="blue" shadow="24px" />
                  </Inline>
                </Inset>
              </ScrollView>
            </Bleed>
          </Stack>
          <Stack space="20px">
            <Inline alignVertical="center" space="6px">
              <Text color="blue" size="15pt" align="center" weight="heavy">
                􀐫
              </Text>
              <Text color="label" size="20pt" weight="heavy">
                Recents
              </Text>
            </Inline>
            <Inline space={{ custom: CARD_PADDING }}>
              <Card />
              <Card />
              <Card />
            </Inline>
          </Stack>
        </Stack>
      </ScrollView>
    </Box>
  );
}
