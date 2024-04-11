import { ButtonPressAnimation } from '@/components/animations';
import { Page } from '@/components/layout';
import { Bleed, Box, ColorModeProvider, Cover, Inline, Inset, Stack, Text, TextIcon, globalColors, useColorMode } from '@/design-system';
import { deviceUtils } from '@/utils';
import React, { useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { ImgixImage } from '@/components/images';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { IS_IOS } from '@/env';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { Site } from '@/state/browserState';
import { useFavoriteDappsStore } from '@/state/favoriteDapps';
import { TrendingSite, trendingDapps } from '@/resources/trendingDapps/trendingDapps';
import { FadeMask } from '@/__swaps__/screens/Swap/components/FadeMask';
import MaskedView from '@react-native-masked-view/masked-view';
import { useBrowserContext } from './BrowserContext';
import { GestureHandlerV1Button } from '@/__swaps__/screens/Swap/components/GestureHandlerV1Button';
import { isEmpty } from 'lodash';
import { normalizeUrl } from './utils';

const HORIZONTAL_PAGE_INSET = 24;

const LOGOS_PER_ROW = 4;
const LOGO_SIZE = 64;
const LOGO_PADDING = (deviceUtils.dimensions.width - LOGOS_PER_ROW * LOGO_SIZE - HORIZONTAL_PAGE_INSET * 2) / (LOGOS_PER_ROW - 1);
const LOGO_BORDER_RADIUS = 16;
const LOGO_LABEL_SPILLOVER = 12;

const NUM_CARDS = 2;
const CARD_PADDING = 12;
const CARD_SIZE = (deviceUtils.dimensions.width - HORIZONTAL_PAGE_INSET * 2 - (NUM_CARDS - 1) * CARD_PADDING) / NUM_CARDS;

const Card = ({ site, showMenuButton }: { showMenuButton?: boolean; site: TrendingSite }) => {
  const { isDarkMode } = useColorMode();
  const { updateActiveTabState } = useBrowserContext();

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
    <GestureHandlerV1Button onPressJS={() => updateActiveTabState({ url: normalizeUrl(site.url) })} scaleTo={0.9}>
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
            {site.screenshot && (
              <Cover>
                <ImgixImage
                  enableFasterImage
                  source={{ uri: site.screenshot }}
                  size={CARD_SIZE}
                  style={{ width: CARD_SIZE, height: 137 }}
                />
                <Cover>
                  <LinearGradient
                    colors={['rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.6)', '#000']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    locations={[0, 0.5, 1]}
                    style={{ width: '100%', height: '100%', borderRadius: 24 }}
                  />
                </Cover>
              </Cover>
            )}
            <Box height={{ custom: 48 }} left={{ custom: -8 }} top={{ custom: -8 }} width={{ custom: 48 }}>
              <ImgixImage
                enableFasterImage
                size={48}
                source={{ uri: site.image }}
                style={{
                  backgroundColor: isDarkMode ? globalColors.grey100 : globalColors.white100,
                  borderRadius: IS_IOS ? 12 : 36,
                  height: 48,
                  width: 48,
                }}
              />
            </Box>
            <Stack space="10px">
              <Text size="17pt" weight="heavy" color="label">
                {site.name}
              </Text>
              <Text size="13pt" weight="bold" color="labelTertiary">
                {site.url}
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
            }}
            width="full"
          />
        )}
      </Box>
    </GestureHandlerV1Button>
  );
};

const Logo = ({ site }: { site: Omit<Site, 'timestamp'> }) => {
  const { updateActiveTabState } = useBrowserContext();
  const { isDarkMode } = useColorMode();

  return (
    <View style={{ width: LOGO_SIZE }}>
      <GestureHandlerV1Button onPressJS={() => updateActiveTabState({ url: normalizeUrl(site.url) })}>
        <Stack alignHorizontal="center">
          <Box>
            {IS_IOS && !isEmpty(site.image) && (
              <Box alignItems="center" height="full" position="absolute" width="full">
                <TextIcon
                  color="labelQuaternary"
                  containerSize={LOGO_SIZE}
                  opacity={isDarkMode ? 0.4 : 0.6}
                  size="icon 28px"
                  weight="black"
                >
                  􀎭
                </TextIcon>
              </Box>
            )}
            <Box
              as={ImgixImage}
              enableFasterImage
              size={LOGO_SIZE}
              source={{ uri: site.image }}
              width={{ custom: LOGO_SIZE }}
              height={{ custom: LOGO_SIZE }}
              background="fillTertiary"
              style={{ borderRadius: LOGO_BORDER_RADIUS }}
            />
            {IS_IOS && (
              <Box
                borderRadius={LOGO_BORDER_RADIUS}
                height="full"
                position="absolute"
                style={{
                  borderColor: isDarkMode ? opacity(globalColors.white100, 0.04) : opacity(globalColors.grey100, 0.02),
                  borderWidth: THICK_BORDER_WIDTH,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}
                width="full"
              />
            )}
          </Box>
          <Bleed bottom="10px" horizontal="8px">
            <MaskedView
              maskElement={<FadeMask fadeEdgeInset={0} fadeWidth={12} side="right" />}
              style={{ width: LOGO_SIZE + LOGO_LABEL_SPILLOVER * 2 }}
            >
              <Text
                size="13pt"
                numberOfLines={1}
                ellipsizeMode="clip"
                weight="bold"
                color="labelSecondary"
                align="center"
                style={{ paddingVertical: 10 }}
              >
                {site.name}
              </Text>
            </MaskedView>
          </Bleed>
        </Stack>
      </GestureHandlerV1Button>
    </View>
  );
};

export default function Homepage() {
  const { isDarkMode } = useColorMode();
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
          paddingHorizontal: HORIZONTAL_PAGE_INSET,
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
                    {trendingDapps.map(site => (
                      <Card key={site.url} site={site} />
                    ))}
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
              <Box
                flexDirection="row"
                flexWrap="wrap"
                gap={LOGO_PADDING}
                width={{ custom: deviceUtils.dimensions.width - HORIZONTAL_PAGE_INSET * 2 }}
              >
                {favoriteDapps.map(dapp => (
                  <Logo key={dapp.url} site={dapp} />
                ))}
              </Box>
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
              {trendingDapps.map(site => (
                <Card key={site.url} site={site} showMenuButton />
              ))}
            </Inline>
          </Stack>
        </Stack>
      </ScrollView>
    </Box>
  );
}
