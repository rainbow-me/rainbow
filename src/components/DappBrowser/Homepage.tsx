import { BlurView } from '@react-native-community/blur';
import React, { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle } from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { ButtonPressAnimation } from '@/components/animations';
import {
  Bleed,
  Border,
  Box,
  ColorModeProvider,
  Cover,
  Inline,
  Inset,
  Stack,
  Text,
  TextIcon,
  globalColors,
  useBackgroundColor,
  useColorMode,
} from '@/design-system';
import { ImgixImage } from '@/components/images';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { IS_ANDROID, IS_IOS, IS_TEST } from '@/env';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { FavoritedSite, useFavoriteDappsStore } from '@/state/browser/favoriteDappsStore';
import { Site, useBrowserHistoryStore } from '@/state/browserHistory';
import { getDappHost } from './handleProviderRequest';
import { uniqBy } from 'lodash';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { EXTRA_WEBVIEW_HEIGHT, WEBVIEW_HEIGHT } from './Dimensions';
import { useBrowserDappsStore } from '@/resources/metadata/dapps';
import { analyticsV2 } from '@/analytics';
import * as i18n from '@/languages';
import { useBrowserStore } from '@/state/browser/browserStore';
import { DndProvider, Draggable, DraggableGrid, DraggableGridProps, UniqueIdentifier } from '../drag-and-drop';
import { EasingGradient } from '../easing-gradient/EasingGradient';
import { useBrowserContext } from './BrowserContext';
import { getNameFromFormattedUrl } from './utils';
import { useTrendingDApps } from '@/resources/metadata/trendingDapps';
import { DApp } from '@/graphql/__generated__/metadata';
import { HOMEPAGE_BACKGROUND_COLOR_DARK, HOMEPAGE_BACKGROUND_COLOR_LIGHT, HTTP, HTTPS } from './constants';
import { useRemoteConfig } from '@/model/remoteConfig';
import { FEATURED_RESULTS, useExperimentalFlag } from '@/config';
import { FeaturedResultStack, FeaturedResultStackProps } from '@/components/FeaturedResult/FeaturedResultStack';

const HORIZONTAL_PAGE_INSET = 24;
const MAX_RECENTS_TO_DISPLAY = 6;
const SCROLL_INDICATOR_INSETS = { bottom: 20, top: 36 };

const LOGOS_PER_ROW = 4;
const LOGO_SIZE = 64;
const RAW_LOGO_PADDING = (DEVICE_WIDTH - LOGOS_PER_ROW * LOGO_SIZE - HORIZONTAL_PAGE_INSET * 2) / (LOGOS_PER_ROW - 1);
const LOGO_PADDING = IS_IOS ? RAW_LOGO_PADDING : Math.floor(RAW_LOGO_PADDING);
const LOGO_BORDER_RADIUS = IS_ANDROID ? 32 : 16;
const LOGO_LABEL_SPILLOVER = 12;

const NUM_CARDS = 2;
const CARD_BORDER_RADIUS = 24;
const CARD_PADDING = 12;
const CARD_HEIGHT = 137;
const CARD_LOGO_SIZE = 48;
const RAW_CARD_WIDTH = (DEVICE_WIDTH - HORIZONTAL_PAGE_INSET * 2 - (NUM_CARDS - 1) * CARD_PADDING) / NUM_CARDS;

export const CARD_WIDTH = IS_IOS ? RAW_CARD_WIDTH : Math.floor(RAW_CARD_WIDTH);

export const Homepage = ({ tabId }: { tabId: string }) => {
  const { extraWebViewHeight, goToUrl } = useBrowserContext();
  const { isDarkMode } = useColorMode();

  const backgroundStyle = isDarkMode ? styles.pageBackgroundDark : styles.pageBackgroundLight;

  const animatedHeightStyle = useAnimatedStyle(() => ({
    height: WEBVIEW_HEIGHT + extraWebViewHeight.value,
  }));

  return (
    <Animated.View style={[backgroundStyle, styles.pageContainer, animatedHeightStyle]}>
      <ScrollView
        contentContainerStyle={[styles.scrollViewContainer, backgroundStyle]}
        scrollIndicatorInsets={SCROLL_INDICATOR_INSETS}
        showsVerticalScrollIndicator={false}
      >
        <Box gap={44}>
          <Trending goToUrl={goToUrl} />
          <Favorites goToUrl={goToUrl} tabId={tabId} />
          <Recents goToUrl={goToUrl} />
        </Box>
      </ScrollView>
    </Animated.View>
  );
};

const DappBrowserFeaturedResults = ({ children }: { children: FeaturedResultStackProps['children'] }) => {
  const { goToUrl } = useBrowserContext();
  const { featured_results } = useRemoteConfig();
  const featuredResultsEnabled = (useExperimentalFlag(FEATURED_RESULTS) || featured_results) && !IS_TEST;

  const onNavigate = useCallback(
    (href: string) => {
      goToUrl(href);
    },
    [goToUrl]
  );

  if (!featuredResultsEnabled) {
    return null;
  }

  return (
    <FeaturedResultStack onNavigate={onNavigate} placementId="dapp_browser_card">
      {children}
    </FeaturedResultStack>
  );
};

const Trending = ({ goToUrl }: { goToUrl: (url: string) => void }) => {
  const { data } = useTrendingDApps();

  if (!data?.dApps?.length) {
    return null;
  }

  return (
    <Stack space="20px">
      <Inline alignVertical="center" space="6px">
        <Text color="red" size="15pt" align="center" weight="heavy">
          􀙭
        </Text>
        <Text color="label" size="20pt" weight="heavy">
          {i18n.t(i18n.l.dapp_browser.homepage.trending)}
        </Text>
      </Inline>
      <Bleed space="24px">
        <ScrollView
          horizontal
          decelerationRate="fast"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          snapToOffsets={data.dApps.map((_, index) => index * (CARD_WIDTH + CARD_PADDING))}
        >
          <Inset space="24px">
            <Box flexDirection="row" gap={CARD_PADDING}>
              <DappBrowserFeaturedResults>
                {({ featuredResult, handlePress }) => (
                  <Card
                    goToUrl={handlePress}
                    site={{
                      image: featuredResult.imageUrl,
                      name: featuredResult.title,
                      url: featuredResult.description,
                    }}
                  />
                )}
              </DappBrowserFeaturedResults>
              {data.dApps
                .filter((dApp): dApp is DApp => dApp !== null)
                .map((dApp, index) => (
                  <Card goToUrl={goToUrl} index={index} key={dApp.url} site={{ ...dApp, image: dApp.iconURL }} />
                ))}
            </Box>
          </Inset>
        </ScrollView>
      </Bleed>
    </Stack>
  );
};

const Favorites = ({ goToUrl, tabId }: { goToUrl: (url: string) => void; tabId: string }) => {
  const { activeTabId, lastActiveHomepageTab } = useBrowserContext();

  const [localGridSort, setLocalGridSort] = useState<string[] | undefined>(() => {
    const orderedIds = useFavoriteDappsStore.getState().getOrderedIds();
    return lastActiveHomepageTab.value === tabId && orderedIds.length > 0 ? orderedIds : undefined;
  });

  const favoriteDapps = useFavoriteDappsStore(state => state.getFavorites(localGridSort));
  const gridKey = useMemo(() => localGridSort?.join('-'), [localGridSort]);
  const isFirstRender = useRef(true);

  const reorderFavorites = useFavoriteDappsStore(state => state.reorderFavorites);

  const onGridOrderChange: DraggableGridProps['onOrderChange'] = useCallback(
    (value: UniqueIdentifier[]) => {
      reorderFavorites(value as string[]);
    },
    [reorderFavorites]
  );

  const reinitializeGridSort = useCallback(() => {
    setLocalGridSort(useFavoriteDappsStore.getState().getOrderedIds());
  }, []);

  useAnimatedReaction(
    () => lastActiveHomepageTab.value === tabId,
    (isActiveHomepage, prevIsActiveHomepage) => {
      const isActiveTab = activeTabId.value === tabId;
      const needsInitialSync = isActiveHomepage && isActiveTab && !localGridSort;

      if ((prevIsActiveHomepage === null && !needsInitialSync) || isActiveHomepage === prevIsActiveHomepage) return;

      if (isActiveHomepage) {
        runOnJS(reinitializeGridSort)();
      } else {
        runOnJS(setLocalGridSort)(undefined);
      }
    },
    []
  );

  // Reinitialize grid sort when favorites are added or removed
  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!favoriteDapps.length || !useBrowserStore.getState().isTabActive(tabId)) {
      return;
    }
    reinitializeGridSort();
  }, [favoriteDapps.length, reinitializeGridSort, tabId]);

  const onPressFavorite = useCallback(
    (dapp: FavoritedSite) => {
      analyticsV2.track(analyticsV2.event.browserTapFavorite, dapp);
      goToUrl(dapp.url);
    },
    [goToUrl]
  );

  return (
    <Box gap={20} style={styles.favoritesContainer}>
      <Inline alignVertical="center" space="6px">
        <Text color="yellow" size="15pt" align="center" weight="heavy">
          􀋃
        </Text>
        <Text color="label" size="20pt" weight="heavy">
          {i18n.t(i18n.l.dapp_browser.homepage.favorites)}
        </Text>
      </Inline>
      {favoriteDapps.length > 0 && localGridSort ? (
        <DndProvider activationDelay={150}>
          <DraggableGrid
            direction="row"
            gap={LOGO_PADDING}
            key={gridKey}
            onOrderChange={onGridOrderChange}
            size={LOGOS_PER_ROW}
            style={styles.favoritesGrid}
          >
            {favoriteDapps.map(dapp =>
              dapp ? (
                <Draggable activationTolerance={DEVICE_WIDTH} activeScale={1.06} id={dapp.url} key={dapp.url}>
                  <Logo onPress={onPressFavorite} key={`${dapp.url}-${dapp.name}`} site={dapp} />
                </Draggable>
              ) : null
            )}
          </DraggableGrid>
        </DndProvider>
      ) : (
        <Inline space={{ custom: LOGO_PADDING }}>
          {favoriteDapps.length > 0
            ? favoriteDapps.map(dapp => <Logo onPress={onPressFavorite} key={`${dapp.url}-${dapp.name}`} site={dapp} />)
            : Array(4)
                .fill(null)
                .map((_, index) => <PlaceholderLogo key={index} />)}
        </Inline>
      )}
    </Box>
  );
};

const Recents = ({ goToUrl }: { goToUrl: (url: string) => void }) => {
  const recents = useBrowserHistoryStore(state => uniqBy(state.recents, 'url').slice(0, MAX_RECENTS_TO_DISPLAY));
  return (
    <Stack space="20px">
      <Inline alignVertical="center" space="6px">
        <Text color="blue" size="15pt" align="center" weight="heavy">
          􀐫
        </Text>
        <Text color="label" size="20pt" weight="heavy">
          {i18n.t(i18n.l.dapp_browser.homepage.recents)}
        </Text>
      </Inline>
      <Box width={{ custom: DEVICE_WIDTH }}>
        <Inline space={{ custom: CARD_PADDING }}>
          {recents.length > 0
            ? recents.map(site => <Card key={site.url} site={site} showMenuButton goToUrl={goToUrl} />)
            : Array(2)
                .fill(null)
                .map((_, index) => <PlaceholderCard key={index} />)}
        </Inline>
      </Box>
    </Stack>
  );
};

const Card = memo(function Card({
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

  const isFavorite = useFavoriteDappsStore(state => state.isFavorite(site.url || ''));
  const addFavorite = useFavoriteDappsStore(state => state.addFavorite);
  const removeFavorite = useFavoriteDappsStore(state => state.removeFavorite);
  const removeRecent = useBrowserHistoryStore(state => state.removeRecent);

  const handleFavoritePress = useCallback(() => {
    const url = site.url;
    if (url) {
      if (isFavorite) {
        removeFavorite(url);
      } else {
        addFavorite({ ...site, name: getNameFromFormattedUrl(site.url, true) });
      }
    }
  }, [addFavorite, isFavorite, removeFavorite, site]);

  const hasVisited = useBrowserHistoryStore(state => state.hasVisited);
  const dappClickedBefore = useMemo(() => hasVisited(site.url), [hasVisited, site.url]);

  const handlePress = useCallback(() => {
    {
      index &&
        analyticsV2.track(analyticsV2.event.browserTrendingDappClicked, {
          name: site.name,
          url: site.url,
          hasClickedBefore: dappClickedBefore,
          index: index,
        });
    }
    goToUrl(site.url);
  }, [dappClickedBefore, goToUrl, index, site.name, site.url]);

  const onPressMenuItem = useCallback(
    async ({ nativeEvent: { actionKey } }: { nativeEvent: { actionKey: 'favorite' | 'remove' } }) => {
      triggerHaptics('selection');
      if (actionKey === 'favorite') {
        handleFavoritePress();
      } else if (actionKey === 'remove') {
        removeRecent(site.url);
      }
    },
    [handleFavoritePress, removeRecent, site.url]
  );

  const menuConfig = useMemo(() => {
    const menuItems = [
      {
        actionKey: 'favorite',
        actionTitle: isFavorite ? i18n.t(i18n.l.dapp_browser.menus.undo_favorite) : i18n.t(i18n.l.dapp_browser.menus.favorite),
        icon: {
          iconType: 'SYSTEM',
          iconValue: isFavorite ? 'star.slash' : 'star',
        },
      },
      {
        actionKey: 'remove',
        actionTitle: i18n.t(i18n.l.dapp_browser.menus.remove),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'trash',
        },
      },
    ];
    return {
      menuTitle: '',
      menuItems,
    };
  }, [isFavorite]);

  const dappIconUrl = useMemo(() => {
    const dappUrl = site.url;
    const iconUrl = site.image;
    const url = dappUrl.startsWith('http') ? dappUrl : `https://${dappUrl}`;
    const host = new URL(url).hostname;
    const dappOverride = useBrowserDappsStore.getState().findDappByHostname(host);
    // 👇 TODO: Remove this once the Uniswap logo in the dapps metadata is fixed
    const isUniswap = host === 'uniswap.org' || host.endsWith('.uniswap.org');
    if (dappOverride?.iconUrl && !isUniswap) {
      return dappOverride.iconUrl;
    }
    return iconUrl;
  }, [site.image, site.url]);

  return (
    <Box>
      <ButtonPressAnimation onPress={handlePress} scaleTo={0.94}>
        <Box background="surfacePrimary" borderRadius={CARD_BORDER_RADIUS} width={{ custom: CARD_WIDTH }}>
          <Box
            borderColor={{ custom: isDarkMode ? opacity(globalColors.white100, 0.09) : opacity(globalColors.grey100, 0.08) }}
            borderRadius={CARD_BORDER_RADIUS}
            borderWidth={THICK_BORDER_WIDTH}
            height={{ custom: CARD_HEIGHT }}
            justifyContent="space-between"
            padding="20px"
            style={[
              styles.cardContainer,
              !dappIconUrl && !site.screenshot ? styles.cardContainerNoImage : {},
              isDarkMode ? styles.cardContainerDark : {},
            ]}
            width={{ custom: CARD_WIDTH }}
          >
            <ColorModeProvider value="dark">
              <CardBackground imageUrl={dappIconUrl || site.screenshot} isDarkMode={isDarkMode} />
              <Box
                height={{ custom: CARD_LOGO_SIZE }}
                left={{ custom: -8 }}
                style={styles.cardLogoWrapper}
                top={{ custom: -8 }}
                width={{ custom: CARD_LOGO_SIZE }}
              >
                <ImgixImage
                  enableFasterImage
                  size={CARD_LOGO_SIZE}
                  source={{ uri: dappIconUrl }}
                  style={{
                    backgroundColor: isDarkMode ? globalColors.grey100 : globalColors.white100,
                    height: CARD_LOGO_SIZE,
                    width: CARD_LOGO_SIZE,
                  }}
                />
              </Box>
              <Stack space="10px">
                <Text size="17pt" weight="heavy" color="label" numberOfLines={2}>
                  {site.name}
                </Text>
                <Text size="13pt" weight="bold" color="labelTertiary" numberOfLines={1}>
                  {site.url.startsWith(HTTP) || site.url.startsWith(HTTPS) ? getDappHost(site.url) : site.url}
                </Text>
              </Stack>
            </ColorModeProvider>
          </Box>
        </Box>
      </ButtonPressAnimation>
      {showMenuButton && (
        <ContextMenuButton menuConfig={menuConfig} onPressMenuItem={onPressMenuItem} style={styles.cardContextMenuButton}>
          <ButtonPressAnimation scaleTo={0.8} style={{ padding: 12 }}>
            <Box borderRadius={12} height={{ custom: 24 }} style={{ overflow: 'hidden' }} width={{ custom: 24 }}>
              <Cover>
                {IS_IOS ? (
                  <BlurView
                    blurAmount={10}
                    blurType={isDarkMode ? 'chromeMaterialDark' : 'light'}
                    style={[styles.contextMenuBlurBackground, { backgroundColor: isDarkMode ? undefined : 'rgba(244, 248, 255, 0.04)' }]}
                  />
                ) : (
                  <Box background="fillQuaternary" height="full" width="full" />
                )}
              </Cover>
              <TextIcon
                color="labelSecondary"
                containerSize={24}
                size="icon 13px"
                textStyle={{ opacity: isDarkMode || IS_ANDROID ? 1 : 0.9 }}
                weight="heavy"
              >
                􀍠
              </TextIcon>
            </Box>
          </ButtonPressAnimation>
        </ContextMenuButton>
      )}
    </Box>
  );
});

const CardBackground = memo(function CardBackgroundOverlay({
  imageUrl,
  isDarkMode,
}: {
  imageUrl: string | undefined;
  isDarkMode: boolean;
}) {
  return imageUrl ? (
    <View shouldRasterizeIOS style={styles.cardBackgroundContainer}>
      <ImgixImage enableFasterImage size={CARD_WIDTH} source={{ uri: imageUrl }} style={styles.cardBackgroundImage} />
      {IS_IOS ? (
        <>
          <BlurView blurAmount={isDarkMode ? 36 : 64} blurType={isDarkMode ? undefined : 'light'} style={styles.absoluteFill} />
          {!isDarkMode && (
            <EasingGradient
              endColor={globalColors.grey100}
              endOpacity={0.28}
              startColor={globalColors.grey100}
              startOpacity={0.2}
              style={styles.absoluteFill}
            />
          )}
        </>
      ) : (
        <EasingGradient
          endColor={globalColors.grey100}
          endOpacity={0.9}
          startColor={globalColors.grey100}
          startOpacity={0.5}
          style={[styles.absoluteFill, { borderRadius: CARD_BORDER_RADIUS }]}
        />
      )}
    </View>
  ) : null;
});

export const PlaceholderCard = memo(function PlaceholderCard() {
  const { isDarkMode } = useColorMode();

  const fillTertiary = useBackgroundColor('fillTertiary');
  const cardOpacity = isDarkMode ? 0.6 : 0.5;

  return (
    <View style={{ width: CARD_WIDTH }}>
      <Box
        as={LinearGradient}
        colors={[opacity(fillTertiary, (isDarkMode ? 0.08 : 0.05) * cardOpacity), opacity(fillTertiary, 0)]}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 1]}
        start={{ x: 0.5, y: 0 }}
        width={{ custom: CARD_WIDTH }}
        height={{ custom: CARD_HEIGHT }}
        style={{ borderRadius: CARD_BORDER_RADIUS }}
      />
      <Border
        borderColor={{ custom: isDarkMode ? opacity(globalColors.white100, 0.04) : opacity(globalColors.grey100, 0.02) }}
        borderRadius={CARD_BORDER_RADIUS}
        borderWidth={THICK_BORDER_WIDTH}
      />
      <Box />
    </View>
  );
});

const Logo = memo(function Logo({ onPress, site }: { onPress: (site: FavoritedSite) => void; site: FavoritedSite }) {
  const { isDarkMode } = useColorMode();

  const imageOrFallback = useMemo(() => {
    return (
      <>
        {site.image && (
          <Box
            as={ImgixImage}
            background="fillTertiary"
            borderRadius={LOGO_BORDER_RADIUS}
            enableFasterImage
            fm="png"
            height={{ custom: LOGO_SIZE }}
            size={LOGO_SIZE}
            source={{ uri: site.image }}
            width={{ custom: LOGO_SIZE }}
          />
        )}

        <Box
          background={site.image ? undefined : 'fillTertiary'}
          borderRadius={LOGO_BORDER_RADIUS}
          height={{ custom: LOGO_SIZE }}
          position={site.image ? 'absolute' : undefined}
          style={[
            IS_IOS
              ? {
                  borderColor: isDarkMode ? opacity(globalColors.white100, 0.04) : opacity(globalColors.grey100, 0.02),
                  borderWidth: THICK_BORDER_WIDTH,
                }
              : {},
            {
              overflow: 'hidden',
              pointerEvents: 'none',
            },
          ]}
          width={{ custom: LOGO_SIZE }}
        />

        {!site.image && (
          <Box alignItems="center" height="full" position="absolute" width="full">
            <TextIcon color="labelQuaternary" containerSize={LOGO_SIZE} opacity={isDarkMode ? 0.4 : 0.6} size="icon 28px" weight="black">
              􀎭
            </TextIcon>
          </Box>
        )}
      </>
    );
  }, [isDarkMode, site.image]);

  return (
    <View style={{ width: LOGO_SIZE }}>
      <ButtonPressAnimation onPress={() => onPress(site)}>
        <Stack alignHorizontal="center">
          <Box>{imageOrFallback}</Box>
          <Bleed bottom="10px" horizontal="8px">
            <Box width={{ custom: LOGO_SIZE + LOGO_LABEL_SPILLOVER * 2 }}>
              <Text align="center" color="labelSecondary" numberOfLines={1} size="13pt" style={{ paddingVertical: 10 }} weight="bold">
                {site.name}
              </Text>
            </Box>
          </Bleed>
        </Stack>
      </ButtonPressAnimation>
    </View>
  );
});

export const PlaceholderLogo = memo(function PlaceholderLogo() {
  const { isDarkMode } = useColorMode();
  const borderRadius = IS_ANDROID ? LOGO_BORDER_RADIUS / 2 : LOGO_BORDER_RADIUS;

  return (
    <View style={{ opacity: isDarkMode ? 0.6 : 0.5, width: LOGO_SIZE }}>
      <Box
        background="fillTertiary"
        borderColor={{ custom: isDarkMode ? opacity(globalColors.white100, 0.04) : opacity(globalColors.grey100, 0.02) }}
        borderRadius={borderRadius}
        borderWidth={THICK_BORDER_WIDTH}
        height={{ custom: LOGO_SIZE }}
        style={{ borderRadius }}
        width={{ custom: LOGO_SIZE }}
      />
    </View>
  );
});

const IMAGE_CLIP_BUFFER = 1;

const styles = StyleSheet.create({
  absoluteFill: {
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  cardBackgroundContainer: {
    height: CARD_HEIGHT + IMAGE_CLIP_BUFFER * 2,
    left: -IMAGE_CLIP_BUFFER,
    position: 'absolute',
    top: -IMAGE_CLIP_BUFFER,
    width: CARD_WIDTH + IMAGE_CLIP_BUFFER * 2,
  },
  cardBackgroundImage: {
    height: CARD_HEIGHT + IMAGE_CLIP_BUFFER * 2,
    width: CARD_WIDTH + IMAGE_CLIP_BUFFER * 2,
  },
  cardContainer: {
    backgroundColor: globalColors.white100,
    overflow: 'hidden',
  },
  cardContainerDark: {
    backgroundColor: globalColors.grey100,
  },
  cardContainerNoImage: {
    backgroundColor: '#191A1C',
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
    borderRadius: 12,
    overflow: 'hidden',
  },
  contextMenuBlurBackground: {
    height: '100%',
    width: '100%',
  },
  favoritesContainer: {
    zIndex: 10,
  },
  favoritesGrid: {
    width: DEVICE_WIDTH - HORIZONTAL_PAGE_INSET * 2,
  },
  pageBackgroundDark: {
    backgroundColor: HOMEPAGE_BACKGROUND_COLOR_DARK,
  },
  pageBackgroundLight: {
    backgroundColor: HOMEPAGE_BACKGROUND_COLOR_LIGHT,
  },
  pageContainer: {
    height: WEBVIEW_HEIGHT + EXTRA_WEBVIEW_HEIGHT,
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
