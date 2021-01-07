import React, { useCallback, useContext, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  newInterpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { borders, colors, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered } from '../layout';
import DiscoverSheetContext from './DiscoverSheetContext';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import ShadowStack from 'react-native-shadow-stack';

const Header = styled.View`
  flex-direction: row;
  height: 59;
  justify-content: space-between;
  margin-vertical: 12;
  position: absolute;
  top: -12;
  width: 100%;
  z-index: 10;
`;

export const FloatingActionButtonShadow = [
  [0, 10, 30, colors.dark, 0.5],
  [0, 5, 15, colors.dark, 1],
];

const BackgroundFill = styled(Centered).attrs({
  ...borders.buildCircleAsObject(43),
})`
  ${position.cover};
  background-color: ${colors.dark};
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
  const isVisible = useDerivedValue(() => {
    const value = stackOpacity.value;
    return withTiming(value);
  });
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: isVisible.value,
  }));

  const animatedWrapperStyle = useAnimatedStyle(() => ({
    opacity: wrapperOpacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const animatedStyleShadow = useAnimatedStyle(() => ({
    opacity: isVisible.value,
  }));

  return (
    <>
      <ButtonPressAnimation
        disabled={disabled}
        onPress={onPress}
        style={{ height: 59, width: 59, zIndex: 10 }}
      >
        <Animated.View style={animatedStyleShadow}>
          <ShadowStack
            {...borders.buildCircleAsObject(43)}
            backgroundColor={colors.dark}
            shadows={FloatingActionButtonShadow}
            style={{ left: 8, opacity: 0.4, position: 'absolute', top: 8 }}
          />
          <BackgroundFill />
        </Animated.View>
        <Animated.View
          style={[{ left, top: 19, zIndex: 10 }, animatedWrapperStyle]}
        >
          <View style={{ position: 'absolute' }}>{children[0]}</View>
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
  const { isSearchModeEnabled } = useContext(DiscoverSheetContext);
  const stackOpacity = useDerivedValue(() =>
    Math.round(newInterpolate(yPosition.value, [50, 51], [0, 1], 'clamp'))
  );

  const translateXLeftButton = useDerivedValue(() =>
    withTiming(stackOpacity.value * 5)
  );

  const translateXRightButton = useDerivedValue(() =>
    withTiming(stackOpacity.value * -0.5)
  );

  const { jumpToShort, addOnCrossMagicBorderListener } =
    useContext(DiscoverSheetContext) || {};

  const onCrossMagicBorder = useCallback(
    ({ below }) => {
      buttonOpacity.value = below ? 0 : 1;
      setButtonsEnabled(!below);
    },
    [buttonOpacity]
  );
  useEffect(() => addOnCrossMagicBorderListener(onCrossMagicBorder), [
    addOnCrossMagicBorderListener,
    onCrossMagicBorder,
  ]);

  const animatedWrapperLOpacity = useDerivedValue(
    () => withTiming(isSearchModeEnabled ? 0 : buttonOpacity.value),
    [isSearchModeEnabled]
  );
  const animatedWrapperROpacity = useDerivedValue(() =>
    withTiming(buttonOpacity.value)
  );

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
        left={19}
        onPress={() => jumpToShort?.()}
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
