import { useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { TurboModuleRegistry } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import styled from 'styled-components/native';
import { GasSpeedButton } from '../components/gas';
import { Centered, Column } from '../components/layout';

import {
  SheetActionButton,
  SheetActionButtonRow,
  SheetHandleFixedToTop,
  SlackSheet,
} from '../components/sheet';
import { Emoji, Text } from '../components/text';
import { safeAreaInsetValues } from '../utils';
import { useDimensions, useKeyboardHeight } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { colors, position } from '@rainbow-me/styles';

const isReanimatedAvailable = !(
  !TurboModuleRegistry.get('NativeReanimated') &&
  (!global.__reanimatedModuleProxy || global.__reanimatedModuleProxy.__shimmed)
);

const springConfig = {
  damping: 500,
  mass: 3,
  stiffness: 1000,
};

// const Container = styled(Column)`
//   flex: 1;
// `;
const Container = styled(Centered).attrs({
  direction: 'column',
})`
  ${position.cover};
  ${({ deviceHeight, height }) =>
    height ? `height: ${height + deviceHeight}` : null};
`;

const CenteredSheet = styled(Centered)`
  border-top-left-radius: 39;
  border-top-right-radius: 39;
`;

const AnimatedContainer = Animated.createAnimatedComponent(Container);
const AnimatedSheet = Animated.createAnimatedComponent(CenteredSheet);

const GasSpeedButtonContainer = styled(Column)`
  justify-content: flex-start;
  margin-bottom: 19px;
`;

export const sheetHeight = android ? 410 : 500;

const CANCEL_TX = 'cancel';
const SPEED_UP = 'speed_up';

const title = {
  [CANCEL_TX]: 'Cancel transaction',
  [SPEED_UP]: 'Speed Up transaction',
};

const text = {
  [CANCEL_TX]: `This will attempt to cancel your pending transaction. It requires broadcasting another transaction!`,
  [SPEED_UP]: `This will speed up your pending transaction by replacing it. There’s still a chance your original transaction will confirm first!`,
};

export default function SpeedUpAndCancelSheet() {
  const { goBack } = useNavigation();
  const { height: deviceHeight } = useDimensions();
  const keyboardHeight = useKeyboardHeight();

  const {
    params: { type },
  } = useRoute();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const handleCancellation = useCallback(() => {}, []);
  const handleSpeedUp = useCallback(() => {}, []);

  const handleCustomGasFocus = useCallback(() => {
    setKeyboardVisible(true);
  }, []);
  const handleCustomGasBlur = useCallback(() => {
    setKeyboardVisible(false);
  }, []);

  const offset = useSharedValue(0);
  const sheetOpacity = useSharedValue(1);
  const animatedContainerStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: offset.value }],
    };
  });
  const animatedSheetStyles = useAnimatedStyle(() => {
    return {
      opacity: sheetOpacity.value,
    };
  });

  const fallbackStyles = {
    marginBottom: keyboardVisible ? keyboardHeight : 0,
  };

  useEffect(() => {
    if (keyboardVisible) {
      offset.value = withSpring(
        -keyboardHeight + safeAreaInsetValues.bottom,
        springConfig
      );
      sheetOpacity.value = withSpring(android ? 0.8 : 0.3, springConfig);
    } else {
      offset.value = withSpring(0, springConfig);
      sheetOpacity.value = withSpring(1, springConfig);
    }
  }, [keyboardHeight, keyboardVisible, offset, sheetOpacity]);
  const sheetHeight =
    (type === CANCEL_TX ? 770 : 720) + safeAreaInsetValues.bottom;

  const marginTop = android ? deviceHeight - sheetHeight + 210 : null;

  return (
    <AnimatedContainer
      style={isReanimatedAvailable ? animatedContainerStyles : fallbackStyles}
    >
      <SlackSheet
        backgroundColor={colors.transparent}
        borderRadius={0}
        height={sheetHeight}
        hideHandle
        scrollEnabled={false}
      >
        <Column>
          <AnimatedSheet
            backgroundColor={colors.white}
            direction="column"
            marginTop={marginTop}
            paddingBottom={0}
            paddingTop={24}
            style={animatedSheetStyles}
          >
            <SheetHandleFixedToTop showBlur={false} />
            <Column marginBottom={17} />
            <Centered direction="column" paddingTop={9}>
              <Column marginBottom={15}>
                <Emoji
                  name={type === CANCEL_TX ? 'skull_and_crossbones' : 'rocket'}
                  size="h1"
                />
              </Column>
              <Column marginBottom={12}>
                <Text
                  color={colors.blueGreyDarker}
                  lineHeight="paragraphSmall"
                  size="larger"
                  weight="bold"
                >
                  {title[type]}
                </Text>
              </Column>
              <Column marginBottom={56} paddingLeft={60} paddingRight={60}>
                <Text
                  align="center"
                  color={colors.alpha(colors.blueGreyDark, 0.5)}
                  lineHeight="paragraphSmall"
                  size="large"
                  weight="normal"
                >
                  {text[type]}
                </Text>
              </Column>

              {type === CANCEL_TX && (
                <Column>
                  <SheetActionButtonRow ignorePaddingTop>
                    <SheetActionButton
                      color={colors.red}
                      label="􀎽 Attempt Cancellation"
                      onPress={handleCancellation}
                      size="big"
                      textColor={colors.white}
                      weight="heavy"
                    />
                  </SheetActionButtonRow>
                  <SheetActionButtonRow ignorePaddingTop>
                    <SheetActionButton
                      color={colors.white}
                      label="Cancel"
                      onPress={goBack}
                      size="big"
                      textColor={colors.alpha(colors.blueGreyDark, 0.8)}
                      weight="heavy"
                    />
                  </SheetActionButtonRow>
                </Column>
              )}
              {type === SPEED_UP && (
                <SheetActionButtonRow ignorePaddingTop>
                  <SheetActionButton
                    color={colors.white}
                    label="Cancel"
                    onPress={goBack}
                    size="big"
                    textColor={colors.alpha(colors.blueGreyDark, 0.8)}
                    weight="bold"
                  />
                  <SheetActionButton
                    color={colors.appleBlue}
                    label="􀎽 Confirm"
                    onPress={handleSpeedUp}
                    size="big"
                    weight="bold"
                  />
                </SheetActionButtonRow>
              )}
              <GasSpeedButtonContainer>
                <GasSpeedButton
                  onCustomGasBlur={handleCustomGasBlur}
                  onCustomGasFocus={handleCustomGasFocus}
                  theme="light"
                  type="transaction"
                />
              </GasSpeedButtonContainer>
            </Centered>
          </AnimatedSheet>
        </Column>
      </SlackSheet>
    </AnimatedContainer>
  );
}
