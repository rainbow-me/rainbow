import { memo, useCallback, useEffect, useMemo, type ReactElement, type ReactNode } from 'react';
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
import { useLazyRef } from '@/hooks/useLazyRef';
import { THICK_BORDER_WIDTH, THICKER_BORDER_WIDTH } from '@/styles/constants';
import { black, white } from '@/worklets/colors';

// ============ Types ========================================================== //

export type FloatingTab = { key: string; label: string; onPress: () => void };

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
}): ReactElement {
  const positionsRef = useLazyRef(() => new Map<string, { x: number; width: number }>());
  const scroll = useAnimatedRef<Animated.ScrollView>();

  const contentWidth = useSharedValue(0);
  const scrollOffset = useSharedValue(0);

  const railWidth = width - (onSearch ? 54 : 0);

  const revealSelected = useCallback(
    (animated: boolean) => {
      const position = positionsRef.current.get(selectedKey);
      if (!position) return;

      runOnUI((itemX: number, itemWidth: number, animated: boolean) => {
        const maxOffset = Math.max(0, contentWidth.value - railWidth);
        const x = Math.max(0, Math.min(maxOffset, itemX - (railWidth - itemWidth) / 2));
        if (x !== scrollOffset.value) scrollTo(scroll, x, 0, animated);
      })(position.x, position.width, animated);
    },
    [contentWidth, positionsRef, railWidth, scroll, scrollOffset, selectedKey]
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
            ref={scroll}
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
                  <ButtonPressAnimation onPress={tab.onPress} scaleTo={0.94} style={styles.tab}>
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
        <ButtonPressAnimation onPress={onSearch} scaleTo={0.92}>
          <TabBarSurface shadowColor={shadowColor} isDarkMode={isDarkMode} width={46}>
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
}): ReactElement {
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
}): ReactElement {
  const backgroundColor = Platform.OS === 'android' ? (isDarkMode ? '#070707' : globalColors.white100) : (isDarkMode ? black : white)(0.8);

  return (
    <View style={[styles.shadow, isDarkMode ? styles.darkShadow : styles.lightShadow, { shadowColor }]}>
      <View style={[styles.surface, { width }, isDarkMode ? undefined : styles.tightShadow]}>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip]}>
          {Platform.OS === 'ios' ? (
            <BlurView blurStyle={isDarkMode ? 'dark' : 'light'} blurIntensity={isDarkMode ? 9 : 7} style={StyleSheet.absoluteFill} />
          ) : null}
          <View style={[StyleSheet.absoluteFill, { backgroundColor }]} />
          {isDarkMode ? <TabBarInnerShadow width={width} /> : null}
        </View>

        <View style={[styles.content, styles.clip]}>{children}</View>
        <Border
          borderRadius={32}
          borderWidth={isDarkMode ? THICKER_BORDER_WIDTH : THICK_BORDER_WIDTH}
          borderColor={{ custom: white(isDarkMode ? 0.03 : 1) }}
          enableInLightMode
        />
      </View>
    </View>
  );
}

function TabBarInnerShadow({ width }: { width: number }): ReactElement {
  const path = useMemo(() => getSquirclePath({ width, height: 46, borderRadius: 32 }), [width]);
  return (
    <Canvas style={{ width, height: 46 }}>
      <Path path={path}>
        <Shadow color={white(0.15)} blur={19.5} dx={0} dy={0} inner shadowOnly />
      </Path>
    </Canvas>
  );
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  bar: {
    height: 46,
    flexDirection: 'row',
    gap: 8,
  },
  surface: {
    height: 46,
    borderRadius: 32,
    borderCurve: 'continuous',
  },
  content: { flex: 1 },
  clip: {
    borderRadius: 32,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  shadow: {
    borderRadius: 32,
    borderCurve: 'continuous',
  },
  darkShadow: {
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 15,
    elevation: 10,
  },
  lightShadow: {
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  tightShadow: {
    shadowColor: globalColors.grey100,
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  items: {
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  tab: { height: 46, justifyContent: 'center' },
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
