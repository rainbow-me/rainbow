import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered } from '../layout';
import DiscoverSheetContext from './DiscoverSheetContext';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { borders, position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const Header = styled.View({
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginVertical: 12,
  position: 'absolute',
  top: -12,
  width: '100%',
  zIndex: 10,
});

const ChildWrapperView = styled.View({
  position: 'absolute',
});

export const FloatingActionButtonShadow = colors => [
  [0, 10, android ? 0 : 30, colors.shadow, 0.5],
  [0, 5, android ? 0 : 15, colors.shadow, 1],
];

const BackgroundFill = styled(Centered).attrs({
  ...borders.buildCircleAsObject(43),
})({
  ...position.coverAsObject,
  backgroundColor: ({ theme: { colors, isDarkMode } }) =>
    isDarkMode ? colors.darkModeDark : colors.blueGreyDark,
  left: 8,
  top: 8,
});

const ALMOST_ZERO = 0.001;
const springConfig = {
  damping: 28,
  mass: 1,
  stiffness: 420,
};

function Stack({
  children,
  left,
  onPress,
  translateX = 0,
  isAboveMagicBorder,
  isWrapperVisible,
  isSearchModeEnabledValue,
}) {
  const { colors, isDarkMode } = useTheme();
  const shadows = useMemo(() => FloatingActionButtonShadow(colors), [colors]);

  const styles1 = useAnimatedStyle(() => ({
    opacity: withSpring(
      isWrapperVisible.value && !isSearchModeEnabledValue.value
        ? 1
        : ALMOST_ZERO,
      springConfig
    ),
  }));

  const styles2 = useAnimatedStyle(() => ({
    opacity: withSpring(
      isAboveMagicBorder.value && !isSearchModeEnabledValue.value
        ? 1
        : ALMOST_ZERO,
      springConfig
    ),
  }));

  const styles3 = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(
          isWrapperVisible.value ? translateX : 0,
          springConfig
        ),
      },
    ],
  }));

  const styles4 = useAnimatedStyle(() => ({
    opacity: withSpring(isWrapperVisible.value ? 1 : ALMOST_ZERO, springConfig),
  }));

  const styles5 = useAnimatedStyle(() => ({
    opacity: withSpring(isWrapperVisible.value ? ALMOST_ZERO : 1, springConfig),
  }));

  const onPressWrapped = useCallback(() => {
    if (isAboveMagicBorder.value) {
      onPress();
    }
  }, [isAboveMagicBorder, onPress]);

  return (
    <>
      <ButtonPressAnimation
        onPress={onPressWrapped}
        style={{ height: 59, width: 59, zIndex: 10 }}
      >
        <Animated.View
          height={59}
          position="absolute"
          style={styles1}
          width={59}
        >
          <ShadowStack
            {...borders.buildCircleAsObject(43)}
            backgroundColor={isDarkMode ? colors.offWhite : colors.dark}
            shadows={shadows}
            style={{ left: 8, opacity: 0.4, position: 'absolute', top: 8 }}
          />
          <BackgroundFill />
        </Animated.View>
        <Animated.View
          style={[
            styles2,
            {
              left,
              top: 19,
              zIndex: 10,
            },
          ]}
        >
          <Animated.View style={styles3}>
            <ChildWrapperView>
              <Animated.View style={styles5}>{children[0]}</Animated.View>
            </ChildWrapperView>
            <Animated.View style={styles4}>{children[1]}</Animated.View>
          </Animated.View>
        </Animated.View>
      </ButtonPressAnimation>
    </>
  );
}

export default function DiscoverSheetHeader(props) {
  const { navigate } = useNavigation();
  const buttonsEnabled = useSharedValue(true);
  const { yPosition } = props;
  const { isSearchModeEnabled, setIsSearchModeEnabled } = useContext(
    DiscoverSheetContext
  );

  const isWrapperVisible = useDerivedValue(() => yPosition.value > 50);

  const isSearchModeEnabledValue = useDerivedValue(() => isSearchModeEnabled, [
    isSearchModeEnabled,
  ]);

  const { jumpToShort, addOnCrossMagicBorderListener } =
    useContext(DiscoverSheetContext) || {};

  const onCrossMagicBorder = useCallback(
    below => {
      buttonsEnabled.value = !below;
    },
    [buttonsEnabled]
  );
  useEffect(() => addOnCrossMagicBorderListener?.(onCrossMagicBorder), [
    addOnCrossMagicBorderListener,
    onCrossMagicBorder,
  ]);

  const { colors } = useTheme();

  const handleScannerPress = useCallback(() => {
    if (!isSearchModeEnabled) {
      setIsSearchModeEnabled?.(false);
      jumpToShort?.();
    }
  }, [isSearchModeEnabled, jumpToShort, setIsSearchModeEnabled]);

  return (
    <Header {...props} pointerEvents="box-none">
      <Stack
        isAboveMagicBorder={buttonsEnabled}
        isSearchModeEnabledValue={isSearchModeEnabledValue}
        isWrapperVisible={isWrapperVisible}
        left={19}
        onPress={() => !isSearchModeEnabled && navigate(Routes.WALLET_SCREEN)}
        translateX={android ? 4 : 5}
      >
        <Icon color={colors.dark} direction="left" name="caret" {...props} />
        <Icon
          color={colors.whiteLabel}
          direction="left"
          name="caret"
          {...props}
        />
      </Stack>
      <Stack
        isAboveMagicBorder={buttonsEnabled}
        isSearchModeEnabledValue={isSearchModeEnabledValue}
        isWrapperVisible={isWrapperVisible}
        left={18.5}
        onPress={handleScannerPress}
      >
        <Icon bottom={1} color={colors.dark} name="scanner" />
        <Icon bottom={1} color={colors.whiteLabel} name="scanner" />
      </Stack>
    </Header>
  );
}
