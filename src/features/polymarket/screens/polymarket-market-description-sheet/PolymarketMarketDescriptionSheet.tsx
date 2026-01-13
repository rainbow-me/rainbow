import { memo, useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { ScrollHeaderFade } from '@/components/scroll-header-fade/ScrollHeaderFade';
import { useScrollFadeHandler } from '@/components/scroll-header-fade/useScrollFadeHandler';
import { Box, globalColors, MarkdownText, Text, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import useUntrustedUrlOpener from '@/navigation/useUntrustedUrlOpener';
import { useRoute } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { THICKER_BORDER_WIDTH } from '@/styles/constants';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';
import { getSolidColorEquivalent } from '@/worklets/colors';

// ============ Constants ====================================================== //

const TITLE_OVERFLOW_BUFFER = 8;
const BOTTOM_FADE_HEIGHT = 32;

const LAYOUT = Object.freeze({
  bottomPadding: 44,
  gap: 28,
  headerPaddingTop: 40,
  horizontalPadding: 24,
  titleHeight: 36,
});

const HEADER_HEIGHT = LAYOUT.headerPaddingTop + LAYOUT.titleHeight + LAYOUT.gap;
const SCROLL_CONTAINER_TOP = LAYOUT.headerPaddingTop + LAYOUT.titleHeight + TITLE_OVERFLOW_BUFFER;
const PANEL_MAX_HEIGHT = DEVICE_HEIGHT * 0.725;
const SCROLL_INDICATOR_INSETS = Object.freeze({ bottom: LAYOUT.bottomPadding });

const GRADIENT_DARK = {
  bottom: getSolidColorEquivalent({ background: globalColors.grey100, foreground: globalColors.white100, opacity: 0.02 }),
  top: getSolidColorEquivalent({ background: globalColors.grey100, foreground: globalColors.white100, opacity: 0.08 }),
};

const GRADIENT_LIGHT = {
  bottom: getSolidColorEquivalent({ background: globalColors.white100, foreground: '#09111F', opacity: 0.06 }),
  top: globalColors.white100,
};

// ============ Component ====================================================== //

export const PolymarketMarketDescriptionSheet = memo(function PolymarketMarketDescriptionSheet() {
  const { params } = useRoute<typeof Routes.POLYMARKET_MARKET_DESCRIPTION_SHEET>();
  const { isDarkMode } = useColorMode();
  const openUntrustedUrl = useUntrustedUrlOpener();

  const [panelHeight, setPanelHeight] = useState<number | undefined>(undefined);
  const scrollOffset = useSharedValue(0);
  const scrollHandler = useScrollFadeHandler(scrollOffset);

  const onContentLayout = useCallback((event: LayoutChangeEvent) => {
    const contentHeight = event.nativeEvent.layout.height;
    const totalHeight = HEADER_HEIGHT + contentHeight + LAYOUT.bottomPadding;
    setPanelHeight(Math.min(totalHeight, PANEL_MAX_HEIGHT));
  }, []);

  const scrollAreaHeight = panelHeight ? panelHeight - HEADER_HEIGHT : undefined;
  const gradient = isDarkMode ? GRADIENT_DARK : GRADIENT_LIGHT;

  const fadeColors = useMemo(() => {
    const height = panelHeight ?? PANEL_MAX_HEIGHT;
    const ratio = SCROLL_CONTAINER_TOP / height;
    return {
      bottom: gradient.bottom,
      top: interpolateColor(gradient.top, gradient.bottom, ratio),
    };
  }, [gradient, panelHeight]);

  return (
    <PanelSheet innerBorderWidth={THICKER_BORDER_WIDTH} height={panelHeight}>
      {isDarkMode && <View style={styles.backgroundBlack} />}
      <LinearGradient colors={[gradient.top, gradient.bottom]} style={styles.backgroundGradient} />
      <View style={styles.header}>
        <Box paddingHorizontal={{ custom: LAYOUT.horizontalPadding }}>
          <Text color="label" size="26pt" weight="heavy">
            {i18n.t(i18n.l.predictions.event.rules)}
          </Text>
        </Box>
      </View>

      <View style={scrollAreaHeight ? [styles.scrollContainer, { height: scrollAreaHeight }] : styles.scrollContainer}>
        <ScrollHeaderFade color={fadeColors.top} height={BOTTOM_FADE_HEIGHT} scrollOffset={scrollOffset} topInset={0} />
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          onScroll={scrollHandler}
          scrollIndicatorInsets={SCROLL_INDICATOR_INSETS}
          showsVerticalScrollIndicator
        >
          <View onLayout={onContentLayout}>
            <MarkdownText
              color="labelSecondary"
              handleLinkPress={openUntrustedUrl}
              listSpace="20px"
              paragraphSpace={{ custom: 40 }}
              paragraphWeight="medium"
              size="20pt / 135%"
            >
              {params.description}
            </MarkdownText>
          </View>
        </Animated.ScrollView>
        <View style={styles.bottomFade}>
          <EasingGradient
            endColor={fadeColors.bottom}
            endOpacity={1}
            startColor={fadeColors.bottom}
            startOpacity={0}
            style={styles.fadeGradient}
          />
        </View>
      </View>
    </PanelSheet>
  );
});

// ============ Helpers ======================================================== //

function interpolateColor(colorA: string, colorB: string, t: number): string {
  const parseHex = (hex: string) => {
    const match = hex.replace('#', '').match(/.{2}/g);
    return match ? match.map(h => parseInt(h, 16)) : [0, 0, 0];
  };
  const [r1, g1, b1] = parseHex(colorA);
  const [r2, g2, b2] = parseHex(colorB);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  backgroundBlack: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: globalColors.grey100,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomFade: {
    bottom: 0,
    left: 0,
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    zIndex: 1000,
  },
  fadeGradient: {
    height: BOTTOM_FADE_HEIGHT,
    width: '100%',
  },
  header: {
    paddingBottom: TITLE_OVERFLOW_BUFFER,
    paddingTop: LAYOUT.headerPaddingTop,
  },
  scrollContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingBottom: LAYOUT.bottomPadding,
    paddingHorizontal: LAYOUT.horizontalPadding,
    paddingTop: LAYOUT.gap - TITLE_OVERFLOW_BUFFER,
  },
});
