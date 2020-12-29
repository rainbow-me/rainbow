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
  position: absolute;
  flex-direction: row;
  justify-content: space-between;
  height: 42;
  margin-vertical: 12;
  top: -12;
  width: 100%;
  z-index: 10;
`;

export const FloatingActionButtonShadow = [
  [0, 2, 5, colors.dark, 0.2],
  [0, 6, 10, colors.dark, 0.14],
  [0, 1, 18, colors.dark, 0.12],
];

const Content = styled(Centered)`
  ${position.cover};
  background-color: ${colors.grey20};
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
        style={{ height: 45, width: 58, zIndex: 10 }}
      >
        <Animated.View style={animatedStyleShadow}>
          <ShadowStack
            style={{ left: 8, position: 'absolute', top: 8 }}
            {...borders.buildCircleAsObject(40)}
            shadows={FloatingActionButtonShadow}
          >
            <Content />
          </ShadowStack>
        </Animated.View>
        <View style={{ left, top: 17, zIndex: 10 }}>
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
  const { jumpToShort, addOnCrossMagicBorderListener } =
    useContext(DiscoverSheetContext) || {};
  const { yPosition } = props;
  const stackOpacity = yPosition;
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
        left={20}
        onPress={() => navigate(Routes.WALLET_SCREEN)}
        stackOpacity={stackOpacity}
      >
        <Icon color={colors.black} direction="left" name="caret" {...props} />
        <Icon color={colors.white} direction="left" name="caret" {...props} />
      </Stack>
      <Stack
        left={16.6}
        onPress={() => jumpToShort?.()}
        stackOpacity={stackOpacity}
      >
        <Icon color={colors.black} name="scanner" />
        <Icon color={colors.white} name="scanner" />
      </Stack>
    </Header>
  );
}
