import { ButtonPressAnimation } from '@/components/animations';
import { Page } from '@/components/layout';
import { Bleed, Box, ColorModeProvider, Cover, Inline, Inset, Stack, Text, globalColors, useColorMode } from '@/design-system';
import { useNavigation } from '@/navigation';
import { deviceUtils } from '@/utils';
import React from 'react';
import { ScrollView, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { ImgixImage } from '@/components/images';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { IS_IOS } from '@/env';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/screens/Swap/utils/swaps';
import { Site } from '@/state/browserState';
import { useFavoriteDappsStore } from '@/state/favoriteDapps';

const HORIZONTAL_INSET = 24;

const NUM_LOGOS = 5;
const LOGO_PADDING = 14;
const LOGO_SIZE = (deviceUtils.dimensions.width - HORIZONTAL_INSET * 2 - (NUM_LOGOS - 1) * LOGO_PADDING) / NUM_LOGOS;

const NUM_CARDS = 2;
const CARD_PADDING = 12;
const CARD_SIZE = (deviceUtils.dimensions.width - HORIZONTAL_INSET * 2 - (NUM_CARDS - 1) * CARD_PADDING) / NUM_CARDS;

const Card = ({ showMenuButton }: { showMenuButton?: boolean }) => {
  const { isDarkMode } = useColorMode();

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
    <ButtonPressAnimation overflowMargin={100} scaleTo={0.9}>
      <Box
        background="surfacePrimary"
        borderRadius={24}
        shadow="18px"
        style={{
          width: CARD_SIZE,
        }}
      >
        <Box
          as={LinearGradient}
          borderRadius={24}
          colors={['#0078FF', '#3AB8FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          width={{ custom: CARD_SIZE }}
          height={{ custom: 137 }}
          justifyContent="space-between"
          padding="20px"
        >
          <ColorModeProvider value="dark">
            {bgImageUrl && (
              <Cover>
                <ImgixImage enableFasterImage source={{ uri: bgImageUrl }} size={CARD_SIZE} style={{ width: CARD_SIZE, height: 137 }} />
                <Cover>
                  <LinearGradient
                    colors={['rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.6)', '#000']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    locations={[0, 0.5, 1]}
                    style={{ width: '100%', height: '100%' }}
                  />
                </Cover>
              </Cover>
            )}
            <Box
              height={{ custom: 48 }}
              left={{ custom: -8 }}
              style={
                IS_IOS
                  ? { shadowColor: globalColors.grey100, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 }
                  : { elevation: 16, shadowColor: globalColors.grey100, shadowOpacity: 1 }
              }
              top={{ custom: -8 }}
              width={{ custom: 48 }}
            >
              <ImgixImage
                enableFasterImage
                size={48}
                source={{ uri: logoImageUrl }}
                style={{
                  backgroundColor: isDarkMode ? globalColors.grey100 : globalColors.white100,
                  borderRadius: 12,
                  height: 48,
                  width: 48,
                }}
              />
            </Box>
            <Stack space="10px">
              <Text size="17pt" weight="heavy" color="label">
                Rainbow World
              </Text>
              <Text size="13pt" weight="bold" color="labelTertiary">
                rainbow.me
              </Text>
            </Stack>
            {showMenuButton && (
              <ContextMenuButton
                menuConfig={menuConfig}
                onPressMenuItem={() => {}}
                style={{ top: 12, right: 12, height: 24, width: 24, position: 'absolute' }}
              >
                <ButtonPressAnimation scaleTo={0.8}>
                  <Box height={{ custom: 24 }} width={{ custom: 24 }} borderRadius={32} style={{ overflow: 'hidden' }}>
                    <Cover>
                      {IS_IOS ? (
                        <BlurView
                          blurType="chromeMaterialDark"
                          blurAmount={10}
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgba(244, 248, 255, 0.08)',
                          }}
                        />
                      ) : (
                        <Box background="fill" height="full" width="full" />
                      )}
                    </Cover>
                    <View
                      style={{
                        width: '100%',
                        height: '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text align="center" weight="heavy" color="labelSecondary" size="13pt">
                        􀍠
                      </Text>
                    </View>
                  </Box>
                </ButtonPressAnimation>
              </ContextMenuButton>
            )}
          </ColorModeProvider>
        </Box>
        {IS_IOS && (
          <Box
            borderRadius={24}
            height="full"
            position="absolute"
            style={{
              borderColor: isDarkMode ? opacity(globalColors.white100, 0.1) : opacity(globalColors.grey100, 0.12),
              borderWidth: THICK_BORDER_WIDTH,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
            width="full"
          />
        )}
      </Box>
    </ButtonPressAnimation>
  );
};

const Logo = ({ site }: { site: Omit<Site, 'timestamp'> }) => {
  return (
    <View style={{ width: LOGO_SIZE }}>
      <ButtonPressAnimation overflowMargin={100}>
        <Stack space="10px" alignHorizontal="center">
          <Box
            as={ImgixImage}
            enableFasterImage
            size={LOGO_SIZE}
            source={{ uri: site.image }}
            width={{ custom: LOGO_SIZE }}
            height={{ custom: LOGO_SIZE }}
            borderRadius={15}
            background="surfacePrimary"
            shadow="24px"
          />
          <Text size="12pt" weight="bold" color="labelSecondary" align="center">
            {site.name}
          </Text>
        </Stack>
      </ButtonPressAnimation>
    </View>
  );
};

export default function Homepage() {
  const { isDarkMode } = useColorMode();
  const { navigate } = useNavigation();
  const { favoriteDapps } = useFavoriteDappsStore();

  return (
    <Box
      as={Page}
      flex={1}
      height="full"
      width="full"
      justifyContent="center"
      style={{ backgroundColor: isDarkMode ? globalColors.grey100 : '#FBFCFD' }}
    >
      <ScrollView
        scrollEnabled={false}
        scrollIndicatorInsets={{
          bottom: 20,
          top: 36,
        }}
        contentContainerStyle={{
          paddingBottom: 20,
          paddingTop: 40,
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
          {favoriteDapps?.length > 0 && (
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
                      {favoriteDapps.map(dapp => (
                        <Logo key={dapp.url} site={dapp} />
                      ))}
                    </Box>
                  </Inset>
                </ScrollView>
              </Bleed>
            </Stack>
          )}
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
              <Card showMenuButton />
              <Card showMenuButton />
              <Card showMenuButton />
            </Inline>
          </Stack>
        </Stack>
      </ScrollView>
    </Box>
  );
}
