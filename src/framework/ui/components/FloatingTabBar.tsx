import { memo, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { PixelRatio, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import MaskedView from '@react-native-masked-view/masked-view';
import { Canvas, Path, Shadow } from '@shopify/react-native-skia';
import { BlurView } from 'react-native-blur-view';
import Animated, {
  runOnUI,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { globalColors } from '@/design-system/color/palettes';
import { Border } from '@/design-system/components/Border/Border';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { getSquirclePath } from '@/design-system/layout/shapes';
import { opacity } from '@/design-system/utils/opacity';
import { SurfaceShadow } from '@/framework/ui/components/SurfaceShadow';
import { useLazyRef } from '@/hooks/useLazyRef';
import { THICK_BORDER_WIDTH, THICKER_BORDER_WIDTH } from '@/styles/constants';
import { white } from '@/worklets/colors';

// ============ Types ========================================================== //

/**
 * A selectable tab in `FloatingTabBar`.
 */
export type FloatingTab = { key: string; label: string; onPress: () => void };

// ============ Constants ====================================================== //

const TAB_BAR_BORDER_RADIUS = 32;
const TAB_BAR_GAP = 8;
const TAB_BAR_HEIGHT = 46;

const TAB_BAR_COLOR_DARK = '#070707';
const TAB_BAR_COLOR_LIGHT = globalColors.white100;

// ============ FloatingTabBar ================================================= //

/**
 * Scrollable tabs that center the selected item, with an optional search button.
 */
export const FloatingTabBar = memo(function FloatingTabBar({
  tabs,
  style,
  selectedKey,
  width,
  isDarkMode,
  shadowColor,
  onSearch,
}: {
  tabs: readonly FloatingTab[];
  style?: StyleProp<ViewStyle>;
  selectedKey: string;
  width: number;
  isDarkMode: boolean;
  shadowColor: string;
  onSearch?: () => void;
}) {
  const positionsRef = useLazyRef(() => new Map<string, { x: number; width: number }>());
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  const contentWidth = useSharedValue(0);
  const scrollOffset = useSharedValue(0);

  const railWidth = width - (onSearch ? TAB_BAR_HEIGHT + TAB_BAR_GAP : 0);

  const revealSelected = useCallback(
    (animated: boolean) => {
      const position = positionsRef.current.get(selectedKey);
      if (!position) return;

      runOnUI((itemX: number, itemWidth: number, animated: boolean) => {
        const maxOffset = Math.max(0, contentWidth.value - railWidth);
        const x = Math.max(0, Math.min(maxOffset, itemX - (railWidth - itemWidth) / 2));
        if (x === scrollOffset.value) return;
        scrollTo(scrollRef, x, 0, animated);
      })(position.x, position.width, animated);
    },
    [contentWidth, positionsRef, railWidth, scrollRef, scrollOffset, selectedKey]
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      scrollOffset.value = event.contentOffset.x;
    },
  });

  useEffect(() => {
    revealSelected(true);
  }, [revealSelected]);

  return (
    <View style={[styles.bar, { width }, style]} pointerEvents="box-none">
      <TabBarSurface shadowColor={shadowColor} isDarkMode={isDarkMode} width={railWidth}>
        <MaskedView
          androidRenderingMode="software"
          style={styles.scrollMask}
          maskElement={<TabBarFadeMask contentWidth={contentWidth} scrollOffset={scrollOffset} width={railWidth} />}
        >
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.items}
            onContentSizeChange={width => {
              contentWidth.value = width;
              revealSelected(false);
            }}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {tabs.map(tab => {
              const selected = tab.key === selectedKey;
              return (
                <View
                  key={tab.key}
                  onLayout={({ nativeEvent: { layout } }) => {
                    positionsRef.current.set(tab.key, { x: layout.x, width: layout.width });
                    if (selected) revealSelected(false);
                  }}
                >
                  <ButtonPressAnimation onPress={tab.onPress} scaleTo={0.88} style={styles.tab}>
                    <Text color="label" size="20pt" weight="heavy" style={selected ? undefined : { opacity: isDarkMode ? 0.4 : 0.3 }}>
                      {tab.label}
                    </Text>
                  </ButtonPressAnimation>
                </View>
              );
            })}
          </Animated.ScrollView>
        </MaskedView>
      </TabBarSurface>

      {onSearch ? (
        <ButtonPressAnimation onPress={onSearch}>
          <TabBarSurface shadowColor={shadowColor} isDarkMode={isDarkMode} width={TAB_BAR_HEIGHT}>
            <View style={styles.searchButton}>
              <TextIcon color="label" size="icon 19px" weight="bold" containerSize={24}>
                {'􀊫'}
              </TextIcon>
            </View>
          </TabBarSurface>
        </ButtonPressAnimation>
      ) : null}
    </View>
  );
});

// ============ Surfaces ======================================================= //

function TabBarFadeMask({
  contentWidth,
  scrollOffset,
  width,
}: {
  contentWidth: SharedValue<number>;
  scrollOffset: SharedValue<number>;
  width: number;
}) {
  const showLeft = useDerivedValue(() => scrollOffset.value > 0);
  const showRight = useDerivedValue(() => contentWidth.value === 0 || scrollOffset.value < Math.max(0, contentWidth.value - width));

  const leftCover = useAnimatedStyle(() => ({ opacity: withTiming(showLeft.value ? 0 : 1, TIMING_CONFIGS.fastFadeConfig) }));
  const rightCover = useAnimatedStyle(() => ({ opacity: withTiming(showRight.value ? 0 : 1, TIMING_CONFIGS.fastFadeConfig) }));

  return (
    <View style={styles.mask}>
      <View style={styles.maskEdge}>
        <EasingGradient
          startColor={globalColors.grey100}
          endColor={globalColors.grey100}
          startOpacity={0}
          endOpacity={1}
          startPosition="left"
          endPosition="right"
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.maskCover, leftCover]} />
      </View>

      <View style={styles.maskCenter} />

      <View style={styles.maskEdge}>
        <EasingGradient
          startColor={globalColors.grey100}
          endColor={globalColors.grey100}
          startOpacity={1}
          endOpacity={0}
          startPosition="left"
          endPosition="right"
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.maskCover, rightCover]} />
      </View>
    </View>
  );
}

function TabBarSurface({
  children,
  width,
  isDarkMode,
  shadowColor,
}: {
  children: ReactNode;
  width: number;
  isDarkMode: boolean;
  shadowColor: string;
}) {
  return (
    <View style={[styles.surface, { elevation: isDarkMode ? 10 : 3, shadowColor, width }]}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip]}>
        {Platform.OS === 'ios' ? (
          <BlurView blurStyle={isDarkMode ? 'dark' : 'light'} blurIntensity={isDarkMode ? 9 : 7} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: isDarkMode ? TAB_BAR_COLOR_DARK : TAB_BAR_COLOR_LIGHT }]} />
        )}
      </View>

      <SurfaceShadow
        backdropColor={isDarkMode ? globalColors.grey100 : globalColors.white100}
        borderRadius={TAB_BAR_BORDER_RADIUS}
        color={opacity(shadowColor, isDarkMode ? 1 : 0.04)}
        opacity={0.8}
        radius={isDarkMode ? 15 : 6}
        y={isDarkMode ? 10 : 4}
      />

      {isDarkMode ? (
        <TabBarInnerShadow width={width} />
      ) : (
        <SurfaceShadow
          backdropColor={globalColors.white100}
          borderRadius={TAB_BAR_BORDER_RADIUS}
          color={globalColors.grey100}
          opacity={0.02}
          radius={3}
          y={2}
        />
      )}

      <View style={[styles.content, styles.clip]}>{children}</View>
      <Border
        borderRadius={TAB_BAR_BORDER_RADIUS}
        borderWidth={isDarkMode ? THICKER_BORDER_WIDTH : THICK_BORDER_WIDTH}
        borderColor={{ custom: white(isDarkMode ? 0.04 : 1) }}
        enableInLightMode
      />
    </View>
  );
}

function TabBarInnerShadow({ width }: { width: number }) {
  const path = useMemo(() => getSquirclePath({ width, height: TAB_BAR_HEIGHT, borderRadius: TAB_BAR_BORDER_RADIUS }), [width]);
  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Path path={path}>
        <Shadow color={white(0.15)} blur={19.5} dx={0} dy={0} inner shadowOnly />
      </Path>
    </Canvas>
  );
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  bar: {
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    gap: TAB_BAR_GAP,
  },
  surface: {
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_BORDER_RADIUS,
    borderCurve: 'continuous',
  },
  content: { flex: 1 },
  clip: {
    borderRadius: TAB_BAR_BORDER_RADIUS,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  items: {
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  tab: { height: TAB_BAR_HEIGHT, justifyContent: 'center' },
  scrollMask: { flex: 1 },
  mask: { flex: 1, flexDirection: 'row' },
  maskEdge: { width: PixelRatio.roundToNearestPixel(36) },
  maskCenter: { flex: 1, backgroundColor: globalColors.grey100 },
  maskCover: { ...StyleSheet.absoluteFillObject, backgroundColor: globalColors.grey100 },
  searchButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
