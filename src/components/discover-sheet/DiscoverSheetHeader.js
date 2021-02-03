import { useRoute } from '@react-navigation/native';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Animated, {
  newInterpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import styled from 'styled-components';
import { borders, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered } from '../layout';
import DiscoverSheetContext from './DiscoverSheetContext';
import { useDelayedValueWithLayoutAnimation } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import ShadowStack from 'react-native-shadow-stack';

const springConfig = {
  damping: 20,
  mass: 1,
  overshootClamping: true,
  stiffness: 400,
};

const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-vertical: 12;
  position: absolute;
  top: -12;
  width: 100%;
  z-index: 10;
`;

export const FloatingActionButtonShadow = colors => [
  [0, 10, 30, colors.shadow, 0.5],
  [0, 5, 15, colors.shadow, 1],
];

const BackgroundFill = styled(Centered).attrs({
  ...borders.buildCircleAsObject(43),
})`
  ${position.cover};
  background-color: ${({ theme: { colors, isDarkMode } }) =>
    isDarkMode ? colors.offWhite : colors.dark};
  left: 8;
  top: 8;
`;

function Stack({
  children,
  left,
  stackOpacity,
  onPress,
  disabled,
  translateX,
  wrapperOpacity,
}) {
  const { colors, isDarkMode } = useTheme();
  const shadows = useMemo(() => FloatingActionButtonShadow(colors), [colors]);
  const isVisible = useDerivedValue(() => {
    const value = stackOpacity.value;
    return withSpring(value, springConfig);
  });
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: isVisible.value,
  }));
  const animatedStyleHide = useAnimatedStyle(() => ({
    opacity: 1 - isVisible.value,
  }));
  const animatedWrapperStyle = useAnimatedStyle(() => ({
    opacity: wrapperOpacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const { isSearchModeEnabled } = useContext(DiscoverSheetContext);

  const areButtonsVisible = useDelayedValueWithLayoutAnimation(
    !disabled && !isSearchModeEnabled
  );

  const animatedStyleShadow = useAnimatedStyle(() => ({
    opacity: isVisible.value,
    ...(ios && {
      transform: [{ scale: isVisible.value + (0.6 - isVisible.value * 0.6) }],
    }),
  }));

  return (
    <>
      <ButtonPressAnimation
        disabled={disabled}
        onPress={onPress}
        style={{ height: 59, width: 59, zIndex: 10 }}
      >
        <Animated.View
          height={59}
          position="absolute"
          style={animatedStyleShadow}
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
            { left, top: 19, zIndex: 10 },
            ios ? animatedWrapperStyle : { opacity: areButtonsVisible ? 1 : 0 },
          ]}
        >
          <Animated.View style={[animatedStyleHide, { position: 'absolute' }]}>
            {children[0]}
          </Animated.View>
          <Animated.View style={animatedStyle}>{children[1]}</Animated.View>
        </Animated.View>
      </ButtonPressAnimation>
    </>
  );
}

export default function DiscoverSheetHeader(props) {
  const { navigate } = useNavigation();
  const [buttonsEnabled, setButtonsEnabled] = useState(true);
  const buttonOpacity = useSharedValue(1);
  const { yPosition } = props;
  const { isSearchModeEnabled, setIsSearchModeEnabled } = useContext(
    DiscoverSheetContext
  );
  const stackOpacity = useDerivedValue(() =>
    Math.round(newInterpolate(yPosition.value, [50, 51], [0, 1], 'clamp'))
  );

  const {
    params: { setSwipeEnabled: setViewPagerSwipeEnabled },
  } = useRoute();

  const translateXLeftButton = useDerivedValue(() =>
    withSpring(stackOpacity.value * 5, springConfig)
  );

  const translateXRightButton = useDerivedValue(() =>
    withSpring(0, springConfig)
  );

  const { jumpToShort, addOnCrossMagicBorderListener } =
    useContext(DiscoverSheetContext) || {};

  const onCrossMagicBorder = useCallback(
    below => {
      buttonOpacity.value = below ? 0 : 1;
      setButtonsEnabled(!below);
    },
    [buttonOpacity]
  );
  useEffect(() => addOnCrossMagicBorderListener?.(onCrossMagicBorder), [
    addOnCrossMagicBorderListener,
    onCrossMagicBorder,
  ]);

  const animatedWrapperLOpacity = useDerivedValue(
    () =>
      withSpring(isSearchModeEnabled ? 0 : buttonOpacity.value, springConfig),
    [isSearchModeEnabled]
  );
  const animatedWrapperROpacity = useDerivedValue(() =>
    withSpring(buttonOpacity.value, springConfig)
  );

  const { colors } = useTheme();

  return (
    <Header {...props} pointerEvents="box-none">
      <Stack
        disabled={!buttonsEnabled}
        left={19}
        onPress={() => !isSearchModeEnabled && navigate(Routes.WALLET_SCREEN)}
        stackOpacity={stackOpacity}
        translateX={translateXLeftButton}
        wrapperOpacity={animatedWrapperLOpacity}
      >
        <Icon
          color={colors.alpha(colors.blueGreyDark, 0.8)}
          direction="left"
          name="caret"
          {...props}
        />
        <Icon color={colors.white} direction="left" name="caret" {...props} />
      </Stack>
      <Stack
        disabled={!buttonsEnabled}
        left={18.5}
        onPress={() => {
          setIsSearchModeEnabled?.(false);
          setViewPagerSwipeEnabled?.(true);
          jumpToShort?.();
        }}
        stackOpacity={stackOpacity}
        translateX={translateXRightButton}
        wrapperOpacity={animatedWrapperROpacity}
      >
        <Icon
          bottom={1}
          color={colors.alpha(colors.blueGreyDark, 0.8)}
          name="scanner"
        />
        <Icon bottom={1} color={colors.white} name="scanner" />
      </Stack>
    </Header>
  );
}
