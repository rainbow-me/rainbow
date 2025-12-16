import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  DerivedValue,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from 'react-native-blur-view';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { AnimatedText, Box, useColorMode, useForegroundColor } from '@/design-system';
import { IS_IOS } from '@/env';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { usePolymarketContext } from '@/features/polymarket/screens/polymarket-navigator/PolymarketContext';
import { PolymarketNavigation, usePolymarketNavigationStore } from '@/features/polymarket/screens/polymarket-navigator/PolymarketNavigator';
import Routes from '@/navigation/routesNames';
import { useListen } from '@/state/internal/hooks/useListen';

const TABS = Object.freeze({
  [Routes.POLYMARKET_BROWSE_EVENTS_SCREEN]: { index: 0, label: 'Browse', value: Routes.POLYMARKET_BROWSE_EVENTS_SCREEN, icon: '􀫸' },
  [Routes.POLYMARKET_ACCOUNT_SCREEN]: { index: 1, label: 'Portfolio', value: Routes.POLYMARKET_ACCOUNT_SCREEN, icon: '􁎢' },
});

type Tab = keyof typeof TABS;

const PADDING_HORIZONTAL = 6;
const PADDING_VERTICAL = 6;
const PILL = Object.freeze({ gap: 0, height: 54, width: 106, borderRadius: 60 });
const CONTENT_WIDTH = PILL.width * Object.keys(TABS).length + PILL.gap * (Object.keys(TABS).length - 1) + PADDING_HORIZONTAL * 2;

export const PolymarketTabSelector = memo(function PolymarketTabSelector() {
  const { isDarkMode } = useColorMode();
  const { accountScrollRef, eventsListRef } = usePolymarketContext();

  const buttonWidth = useDerivedValue<number>(() => PILL.width);
  const selectedIndex = useSharedValue(TABS[usePolymarketNavigationStore.getState().activeRoute as Tab]?.index ?? 0);

  useListen(
    usePolymarketNavigationStore,
    state => state.activeRoute,
    route => {
      if (!TABS[route as keyof typeof TABS]) return;
      selectedIndex.value = TABS[route as keyof typeof TABS].index;
    }
  );

  const handleTabPress = useCallback(
    (tab: Tab) => {
      if (PolymarketNavigation.isRouteActive(tab)) {
        switch (tab) {
          case Routes.POLYMARKET_BROWSE_EVENTS_SCREEN:
            eventsListRef.current?.scrollToOffset({ animated: true, offset: 0 });
            break;
          case Routes.POLYMARKET_ACCOUNT_SCREEN:
            accountScrollRef.current?.scrollTo({ animated: true, y: 0 });
            break;
        }
      } else {
        PolymarketNavigation.navigate(tab);
      }
    },
    [accountScrollRef, eventsListRef]
  );

  const onPress = useCallback(
    (tab: Tab) => {
      'worklet';
      selectedIndex.value = TABS[tab].index;
      runOnJS(handleTabPress)(tab);
    },
    [handleTabPress, selectedIndex]
  );

  return (
    <Box
      flexDirection="row"
      justifyContent="center"
      alignItems="center"
      width={CONTENT_WIDTH}
      paddingVertical={{ custom: PADDING_VERTICAL }}
      borderRadius={64}
      borderWidth={THICKER_BORDER_WIDTH}
      borderColor={{ custom: opacityWorklet('#DC91F4', 0.03) }}
    >
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          style={[StyleSheet.absoluteFill, { opacity: 0.07 }]}
          colors={['#DC91F4', opacityWorklet('#DC91F4', 0.5)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <BlurView blurIntensity={24} blurStyle={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <InnerShadow borderRadius={PILL.borderRadius} color={opacityWorklet('#DC91F4', 0.14)} blur={5} dx={0} dy={1} />
      </View>
      <SelectedHighlight buttonWidth={buttonWidth} selectedIndex={selectedIndex} paddingHorizontal={PADDING_HORIZONTAL} />
      <TabButtons onPress={onPress} selectedIndex={selectedIndex} />
    </Box>
  );
});

const SelectedHighlight = memo(function SelectedHighlight({
  buttonWidth,
  selectedIndex,
  paddingHorizontal = 0,
}: {
  buttonWidth: DerivedValue<number>;
  selectedIndex: SharedValue<number>;
  paddingHorizontal?: number;
}) {
  const { isDarkMode } = useColorMode();
  const highlightBackgroundColor = opacityWorklet('#82408F', 0.3);
  const borderColor = opacityWorklet('#DC91F4', isDarkMode ? 0.06 : 0.03);

  const translateX = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(selectedIndex.value * buttonWidth.value + paddingHorizontal, SPRING_CONFIGS.snappyMediumSpringConfig),
      },
    ],
  }));

  const width = useAnimatedStyle(() => ({
    width: withSpring(buttonWidth.value, SPRING_CONFIGS.snappyMediumSpringConfig),
  }));

  return (
    <Animated.View style={[styles.selectedHighlight, { backgroundColor: highlightBackgroundColor, borderColor }, translateX, width]} />
  );
});

const TabButton = ({
  index,
  value,
  label,
  icon,
  onPress,
  selectedIndex,
}: {
  icon: string;
  index: number;
  label: string;
  onPress: (tab: Tab) => void;
  selectedIndex: SharedValue<number>;
  value: Tab;
}) => {
  const labelTertiary = useForegroundColor('labelTertiary');

  const iconStyle = useAnimatedStyle(() => {
    const isSelected = selectedIndex.value === index;
    const textColor = isSelected ? '#C863E8' : labelTertiary;
    if (!IS_IOS) return { color: textColor };
    return {
      color: textColor,
    };
  });

  return (
    <GestureHandlerButton
      hapticTrigger="tap-end"
      hapticType="soft"
      hitSlop={4}
      onPressWorklet={() => {
        'worklet';
        onPress(value);
      }}
      style={styles.button}
    >
      <View style={styles.iconContainer}>
        <AnimatedText align="center" color="label" size={icon === '􀫸' ? 'icon 21px' : 'icon 20px'} style={iconStyle} weight="heavy">
          {icon}
        </AnimatedText>
        <AnimatedText align="center" color="label" size="13pt" weight="bold">
          {label}
        </AnimatedText>
      </View>
    </GestureHandlerButton>
  );
};

const TabButtons = ({ onPress, selectedIndex }: { onPress: (tab: Tab) => void; selectedIndex: SharedValue<number> }) => {
  return Object.values(TABS).map(({ icon, index, label, value }) => (
    <TabButton index={index} key={value} label={label} icon={icon} onPress={onPress} selectedIndex={selectedIndex} value={value} />
  ));
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: PILL.height,
    justifyContent: 'center',
    width: PILL.width,
    gap: 10,
  },
  iconContainer: {
    flexDirection: 'column',
    height: 34,
    justifyContent: 'space-between',
  },
  selectedHighlight: {
    borderCurve: 'continuous',
    borderRadius: PILL.borderRadius,
    borderWidth: 2,
    height: PILL.height,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    width: PILL.width,
  },
});
