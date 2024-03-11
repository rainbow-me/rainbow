import { ButtonPressAnimation } from '@/components/animations';
import { Page } from '@/components/layout';
import { Bleed, Box, ColorModeProvider, Cover, Inline, Inset, Stack, Text } from '@/design-system';
import { useNavigation } from '@/navigation';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { deviceUtils, safeAreaInsetValues } from '@/utils';
import React from 'react';
import { ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { ImgixImage } from '@/components/images';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';

const HORIZONTAL_INSET = 24;

const NUM_LOGOS = 5;
const LOGO_PADDING = 14;
const LOGO_SIZE = (deviceUtils.dimensions.width - HORIZONTAL_INSET * 2 - (NUM_LOGOS - 1) * LOGO_PADDING) / NUM_LOGOS;

const NUM_CARDS = 2;
const CARD_PADDING = 12;
const CARD_SIZE = (deviceUtils.dimensions.width - HORIZONTAL_INSET * 2 - (NUM_CARDS - 1) * CARD_PADDING) / NUM_CARDS;

const Card = () => {
  const bgImageUrl = 'https://nftcalendar.io/storage/uploads/2022/05/06/banner_discord1_05062022181527627565bf3c203.jpeg';
  const logoImageUrl = 'https://pbs.twimg.com/profile_images/1741494128779886592/RY4V0T2F_400x400.jpg';

  const menuConfig = {
    menuTitle: '',
    menuItems: [
      {
        actionKey: 'test1',
        actionTitle: 'Option 1',
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'chart.line.uptrend.xyaxis',
        },
      },
      {
        actionKey: 'test2',
        actionTitle: 'Option 2',
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'plus.forwardslash.minus',
        },
      },
    ],
  };

  return (
    <ColorModeProvider value="dark">
      <ButtonPressAnimation>
        <Box
          as={ImgixImage}
          background="surfacePrimary"
          borderRadius={24}
          shadow="18px"
          width={{ custom: CARD_SIZE }}
          height={{ custom: 137 }}
          justifyContent="space-between"
          padding="20px"
          source={{ uri: bgImageUrl }}
          size={CARD_SIZE}
        >
          <Cover>
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.6)', '#000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              locations={[0, 0.4985, 1]}
              style={{ width: '100%', height: '100%' }}
            />
          </Cover>
          <Box
            as={ImgixImage}
            source={{ uri: logoImageUrl }}
            size={48}
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
          <Box
            position="absolute"
            top={{ custom: 12 }}
            right={{ custom: 12 }}
            height={{ custom: 24 }}
            width={{ custom: 24 }}
            borderRadius={32}
            style={{ flex: 1, overflow: 'hidden', backgroundColor: 'rgba(244, 248, 255, 0.08)' }}
          >
            <ContextMenuButton menuConfig={menuConfig} onPressMenuItem={() => {}}>
              <BlurView
                blurType="chromeMaterialDark"
                blurAmount={8.5}
                style={{
                  width: '100%',
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(244, 248, 255, 0.08)',
                }}
              >
                <Text align="center" weight="heavy" color="labelSecondary" size="13pt">
                  􀍠
                </Text>
              </BlurView>
            </ContextMenuButton>
          </Box>
        </Box>
      </ButtonPressAnimation>
    </ColorModeProvider>
  );
};

const Logo = () => {
  const imageUrl = 'https://pbs.twimg.com/profile_images/1741494128779886592/RY4V0T2F_400x400.jpg';

  return (
    <ButtonPressAnimation>
      <Stack space="12px" alignHorizontal="center">
        <Box
          as={ImgixImage}
          size={LOGO_SIZE}
          source={{ uri: imageUrl }}
          width={{ custom: LOGO_SIZE }}
          height={{ custom: LOGO_SIZE }}
          borderRadius={15}
          background="surfacePrimary"
          shadow="24px"
        />
        <Text size="12pt" weight="bold" color="labelSecondary" align="center">
          Zora
        </Text>
      </Stack>
    </ButtonPressAnimation>
  );
};

export default function DappBrowserScreen() {
  const { navigate } = useNavigation();

  return (
    <Box as={Page} flex={1} height="full" width="full" justifyContent="center">
      <ScrollView
        scrollIndicatorInsets={{
          bottom: TAB_BAR_HEIGHT - safeAreaInsetValues.bottom,
        }}
        contentContainerStyle={{
          paddingBottom: TAB_BAR_HEIGHT + 32,
          paddingTop: 87,
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
            <Bleed space="24px">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Inset space="24px">
                  <Box flexDirection="row" gap={CARD_PADDING}>
                    <Card />
                    <Card />
                    <Card />
                  </Box>
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
            <Bleed space="24px">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Inset space="24px">
                  <Box flexDirection="row" gap={LOGO_PADDING}>
                    <Logo />
                    <Logo />
                    <Logo />
                    <Logo />
                    <Logo />
                    <Logo />
                    <Logo />
                  </Box>
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
