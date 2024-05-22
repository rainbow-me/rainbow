import React, { useCallback, useMemo } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Bleed, Box, ColorModeProvider, Cover, Inline, Inset, Stack, Text, TextIcon, globalColors, useColorMode } from '@/design-system';
import { ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { ImgixImage } from '@/components/images';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { IS_IOS } from '@/env';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { useFavoriteDappsStore } from '@/state/favoriteDapps';
// import { FadeMask } from '@/__swaps__/screens/Swap/components/FadeMask';
// import MaskedView from '@react-native-masked-view/masked-view';
import { Site, useBrowserHistoryStore } from '@/state/browserHistory';
import { getDappHost } from './handleProviderRequest';
import { uniqBy } from 'lodash';
import { useBrowserContext } from './BrowserContext';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { WEBVIEW_HEIGHT } from './Dimensions';
import { useDapps } from '@/resources/metadata/dapps';
import { analyticsV2 } from '@/analytics';

const HORIZONTAL_PAGE_INSET = 24;
const MAX_RECENTS_TO_DISPLAY = 6;
const SCROLL_INDICATOR_INSETS = { bottom: 20, top: 36 };

const LOGOS_PER_ROW = 4;
const LOGO_SIZE = 64;
const LOGO_PADDING = (DEVICE_WIDTH - LOGOS_PER_ROW * LOGO_SIZE - HORIZONTAL_PAGE_INSET * 2) / (LOGOS_PER_ROW - 1);
const LOGO_BORDER_RADIUS = 16;
const LOGO_LABEL_SPILLOVER = 12;

const NUM_CARDS = 2;
const CARD_PADDING = 12;
const CARD_HEIGHT = 137;
const CARD_WIDTH = (DEVICE_WIDTH - HORIZONTAL_PAGE_INSET * 2 - (NUM_CARDS - 1) * CARD_PADDING) / NUM_CARDS;

export const Homepage = React.memo(function Homepage() {
  const { goToUrl } = useBrowserContext();
  const { isDarkMode } = useColorMode();

  return (
    <View style={[isDarkMode ? styles.pageBackgroundDark : styles.pageBackgroundLight, styles.pageContainer]}>
      <ScrollView
        scrollIndicatorInsets={SCROLL_INDICATOR_INSETS}
        contentContainerStyle={styles.scrollViewContainer}
        showsVerticalScrollIndicator={false}
      >
        <Stack space="44px">
          <Trending goToUrl={goToUrl} />
          <Favorites goToUrl={goToUrl} />
          <Recents goToUrl={goToUrl} />
        </Stack>
      </ScrollView>
    </View>
  );
});

const Trending = React.memo(function Trending({ goToUrl }: { goToUrl: (url: string) => void }) {
  const { dapps } = useDapps();

  const trendingDapps = dapps.filter(dapp => dapp.trending).slice(0, 8);

  return (
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
        <ScrollView
          horizontal
          decelerationRate="fast"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          snapToOffsets={trendingDapps.map((_, index) => index * (CARD_WIDTH + CARD_PADDING))}
        >
          <Inset space="24px">
            <Box flexDirection="row" gap={CARD_PADDING}>
              {trendingDapps.map((site, index) => (
                <Card goToUrl={goToUrl} index={index} key={site.url} site={{ ...site, image: site.iconUrl }} />
              ))}
            </Box>
          </Inset>
        </ScrollView>
      </Bleed>
    </Stack>
  );
});

const Favorites = React.memo(function Favorites({ goToUrl }: { goToUrl: (url: string) => void }) {
  const favoriteDapps = useFavoriteDappsStore(state => state.favoriteDapps);

  return (
    favoriteDapps?.length > 0 && (
      <Stack space="20px">
        <Inline alignVertical="center" space="6px">
          <Text color="yellow" size="15pt" align="center" weight="heavy">
            􀋃
          </Text>
          <Text color="label" size="20pt" weight="heavy">
            Favorites
          </Text>
        </Inline>
        <Box flexDirection="row" flexWrap="wrap" gap={LOGO_PADDING} width={{ custom: DEVICE_WIDTH - HORIZONTAL_PAGE_INSET * 2 }}>
          {favoriteDapps.map(dapp => (
            <Logo goToUrl={goToUrl} key={`${dapp.url}-${dapp.name}`} site={dapp} />
          ))}
        </Box>
      </Stack>
    )
  );
});

const Recents = React.memo(function Recents({ goToUrl }: { goToUrl: (url: string) => void }) {
  const recents = useBrowserHistoryStore(state => uniqBy(state.recents, 'url').slice(0, MAX_RECENTS_TO_DISPLAY));

  return (
    recents.length > 0 && (
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
          {recents.map(site => (
            <Card key={site.url} site={site} showMenuButton goToUrl={goToUrl} />
          ))}
        </Inline>
      </Stack>
    )
  );
});

const Card = React.memo(function Card({
  goToUrl,
  site,
  showMenuButton,
  index,
}: {
  goToUrl: (url: string) => void;
  showMenuButton?: boolean;
  site: Omit<Site, 'timestamp'>;
  index?: number;
}) {
  const { isDarkMode } = useColorMode();
  const browserHistoryStore = useBrowserHistoryStore();
  const { dapps } = useDapps();

  const dappClickedBefore = useMemo(() => browserHistoryStore.hasVisited(site.url), [browserHistoryStore, site.url]);

  const handlePress = useCallback(() => {
    {
      index &&
        analyticsV2.track(analyticsV2.event.browserTrendingDappClicked, {
          hasClickedBefore: dappClickedBefore,
          index: index,
        });
    }
    goToUrl(site.url);
  }, [dappClickedBefore, goToUrl, index, site.url]);

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

  const dappIconUrl = useMemo(() => {
    const dappUrl = site.url;
    const iconUrl = site.image;
    const host = getDappHost(dappUrl);
    const overrideFound = dapps.find((dapp: { url: string }) => dapp.url === host);
    if (overrideFound?.iconUrl) {
      return overrideFound.iconUrl;
    }
    return iconUrl;
  }, [dapps, site.image, site.url]);

  return (
    <Box>
      <ButtonPressAnimation onPress={() => handlePress()} scaleTo={0.94}>
        <Box
          background="surfacePrimary"
          borderRadius={24}
          shadow="18px"
          style={{
            width: CARD_WIDTH,
          }}
        >
          <Box
            borderRadius={24}
            height={{ custom: CARD_HEIGHT }}
            justifyContent="space-between"
            padding="20px"
            style={[styles.cardContainer, isDarkMode && styles.cardContainerDark]}
            width={{ custom: CARD_WIDTH }}
          >
            <ColorModeProvider value="dark">
              {(site.screenshot || dappIconUrl) && (
                <Cover>
                  <ImgixImage
                    enableFasterImage
                    source={{ uri: site.screenshot || dappIconUrl }}
                    size={CARD_WIDTH}
                    style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
                  />
                  <Cover>
                    <LinearGradient
                      colors={['rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.6)', '#000']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      locations={[0, 0.5, 1]}
                      style={{ borderRadius: IS_IOS ? undefined : 24, height: '100%', width: '100%' }}
                    />
                  </Cover>
                </Cover>
              )}
              <Box height={{ custom: 48 }} left={{ custom: -8 }} style={styles.cardLogoWrapper} top={{ custom: -8 }} width={{ custom: 48 }}>
                <ImgixImage
                  enableFasterImage
                  size={48}
                  source={{ uri: dappIconUrl }}
                  style={{
                    backgroundColor: isDarkMode ? globalColors.grey100 : globalColors.white100,
                    height: 48,
                    width: 48,
                  }}
                />
              </Box>
              <Stack space="10px">
                <Text size="17pt" weight="heavy" color="label" numberOfLines={2}>
                  {site.name}
                </Text>
                <Text size="13pt" weight="bold" color="labelTertiary" numberOfLines={1}>
                  {site.url.startsWith('http:') || site.url.startsWith('https:') ? getDappHost(site.url) : site.url}
                </Text>
              </Stack>
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
      {showMenuButton && (
        <ContextMenuButton menuConfig={menuConfig} onPressMenuItem={() => {}} style={styles.cardContextMenuButton}>
          <ButtonPressAnimation scaleTo={0.8} style={{ padding: 12 }}>
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
    </Box>
  );
});

export const Logo = React.memo(function Logo({ goToUrl, site }: { goToUrl: (url: string) => void; site: Omit<Site, 'timestamp'> }) {
  const { isDarkMode } = useColorMode();

  return (
    <View style={{ width: LOGO_SIZE }}>
      <ButtonPressAnimation onPress={() => goToUrl(site.url)}>
        <Stack alignHorizontal="center">
          <Box>
            {IS_IOS && !site.image && (
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
              fm="png"
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
            {/* <MaskedView
              maskElement={<FadeMask fadeEdgeInset={0} fadeWidth={12} side="right" />}
              style={{ width: LOGO_SIZE + LOGO_LABEL_SPILLOVER * 2 }}
            > */}
            <Box width={{ custom: LOGO_SIZE + LOGO_LABEL_SPILLOVER * 2 }}>
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
            </Box>
            {/* </MaskedView> */}
          </Bleed>
        </Stack>
      </ButtonPressAnimation>
    </View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FBFCFD',
    overflow: 'hidden',
  },
  cardContainerDark: {
    backgroundColor: globalColors.grey100,
  },
  cardContextMenuButton: {
    alignItems: 'center',
    top: 0,
    right: 0,
    height: 48,
    justifyContent: 'center',
    width: 48,
    position: 'absolute',
  },
  cardLogoWrapper: {
    borderRadius: IS_IOS ? 12 : 36,
    overflow: 'hidden',
  },
  pageBackgroundDark: {
    backgroundColor: globalColors.grey100,
  },
  pageBackgroundLight: {
    backgroundColor: '#FBFCFD',
  },
  pageContainer: {
    height: WEBVIEW_HEIGHT,
    left: 0,
    position: 'absolute',
    top: 0,
    width: DEVICE_WIDTH,
    zIndex: 30000,
  },
  scrollViewContainer: {
    paddingBottom: 20,
    paddingTop: 40,
    paddingHorizontal: HORIZONTAL_PAGE_INSET,
  },
});
