import React, { useCallback, useContext, useEffect } from 'react';
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

const Header = styled(Animated.View)`
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

function Stack({ children, left, stackOpacity, onPress }) {
  const isVisible = useDerivedValue(() => {
    const value = Math.round(
      newInterpolate(stackOpacity.value, [50, 51], [0, 1], 'clamp')
    );
    return withTiming(value);
  });
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: isVisible.value,
  }));

  const animatedStyleShadow = useAnimatedStyle(() => ({
    opacity: isVisible.value,
  }));

  return (
    <>
      <ButtonPressAnimation
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
        <View style={{ left, top: 19, zIndex: 10 }}>
          <View style={{ position: 'absolute' }}>{children[0]}</View>
          <Animated.View style={animatedStyle}>{children[1]}</Animated.View>
        </View>
      </ButtonPressAnimation>
    </>
  );
}

export default function DiscoverSheetHeader(props) {
  const { navigate } = useNavigation();
  const buttonOpacity = useSharedValue(1);
  const { yPosition } = props;
  const stackOpacity = yPosition;
  const { jumpToShort, addOnCrossMagicBorderListener } =
    useContext(DiscoverSheetContext) || {};
  const onCrossMagicBorder = useCallback(
    ({ below }) => (buttonOpacity.value = below ? 0 : 1),
    [buttonOpacity]
  );
  useEffect(() => addOnCrossMagicBorderListener(onCrossMagicBorder), [
    addOnCrossMagicBorderListener,
    onCrossMagicBorder,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(buttonOpacity.value),
  }));

  return (
    <Header
      {...props}
      opacity={buttonOpacity}
      pointerEvents="box-none"
      style={[animatedStyle]}
    >
      <Stack
        left={19}
        onPress={() => navigate(Routes.WALLET_SCREEN)}
        stackOpacity={stackOpacity}
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
        left={18}
        onPress={() => jumpToShort?.()}
        stackOpacity={stackOpacity}
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
