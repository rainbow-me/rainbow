import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { AnimatedText, Box, useColorMode, useForegroundColor } from '@/design-system';
import Animated, {
  DerivedValue,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { IS_IOS } from '@/env';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import Routes from '@/navigation/routesNames';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from 'react-native-blur-view';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { PolymarketNavigation, usePolymarketNavigationStore } from '@/features/polymarket/screens/polymarket-navigator/PolymarketNavigator';
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
  const buttonWidth = useDerivedValue<number>(() => PILL.width);
  const selectedIndex = useSharedValue(TABS[Routes.POLYMARKET_BROWSE_EVENTS_SCREEN].index);

  useListen(
    usePolymarketNavigationStore,
    state => state.activeRoute,
    route => {
      if (!TABS[route as keyof typeof TABS]) return;
      selectedIndex.value = TABS[route as keyof typeof TABS].index;
    }
  );

  const onPress = useCallback(
    (tab: Tab) => {
      'worklet';
      selectedIndex.value = TABS[tab].index;
      runOnJS(navigateToTab)(tab);
    },
    [selectedIndex]
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
        <BlurView blurIntensity={24} blurStyle={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <LinearGradient
          style={[StyleSheet.absoluteFill, { opacity: 0.07 }]}
          colors={['#DC91F4', opacityWorklet('#DC91F4', 0.5)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
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
  const borderColor = isDarkMode ? highlightBackgroundColor : opacityWorklet('#DC91F4', 0.03);

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
  const labelQuaternary = useForegroundColor('labelQuaternary');

  const iconStyle = useAnimatedStyle(() => {
    const isSelected = selectedIndex.value === index;
    const textColor = isSelected ? '#C863E8' : labelQuaternary;
    if (!IS_IOS) return { color: textColor };
    return {
      color: textColor,
      fontWeight: isSelected ? '800' : '700',
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
      <AnimatedText align="center" color="label" size="22pt" style={iconStyle} weight="bold">
        {icon}
      </AnimatedText>
      <AnimatedText align="center" color="label" size="15pt" weight="bold">
        {label}
      </AnimatedText>
    </GestureHandlerButton>
  );
};

const TabButtons = ({ onPress, selectedIndex }: { onPress: (tab: Tab) => void; selectedIndex: SharedValue<number> }) => {
  return Object.values(TABS).map(({ icon, index, label, value }) => (
    <TabButton index={index} key={value} label={label} icon={icon} onPress={onPress} selectedIndex={selectedIndex} value={value} />
  ));
};

function navigateToTab(tab: Tab) {
  PolymarketNavigation.navigate(tab);
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: PILL.height,
    justifyContent: 'center',
    width: PILL.width,
    gap: 10,
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
