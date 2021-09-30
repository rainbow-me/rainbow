import { useIsFocused, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import Divider from '../Divider';
import { GasSpeedButton } from '../gas';
import { Column } from '../layout';
import {
  SheetHandleFixedToTopHeight,
  SheetKeyboardAnimation,
  SlackSheet,
} from '../sheet';
import { FeesPanel, FeesPanelTabs } from './custom-gas';
import {
  useAccountSettings,
  useBooleanState,
  useDimensions,
  useGas,
  useHeight,
  useKeyboardHeight,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { padding, position } from '@rainbow-me/styles';

const springConfig = {
  damping: 500,
  mass: 3,
  stiffness: 1000,
};

const AnimatedContainer = styled(Animated.View)`
  ${position.size('100%')};
`;

const Footer = styled(Column).attrs({
  align: 'end',
  grow: 1,
  justify: 'end',
  shrink: 0,
})`
  ${padding(6, 0, 0)};
  background-color: transparent;
`;

const PanelWrapper = styled.View``;

const FOOTER_MIN_HEIGHT = 143;
const FOOTER_CONTENT_MIN_HEIGHT = 241;

function useAndroidDisableGesturesOnFocus() {
  const { params } = useRoute();
  const isFocused = useIsFocused();
  useEffect(() => {
    android && params?.toggleGestureEnabled?.(!isFocused);
  }, [isFocused, params]);
}

export default function CustomGasState({ restoreFocusOnSwapModal }) {
  const { network } = useAccountSettings();
  const { setParams } = useNavigation();
  const { params: { longFormHeight } = {} } = useRoute();
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const keyboardHeight = useKeyboardHeight();
  const [isKeyboardVisible, showKeyboard, hideKeyboard] = useBooleanState();
  const insets = useSafeArea();
  const [footerHeight, setFooterHeight] = useHeight(FOOTER_MIN_HEIGHT);
  const [slippageMessageHeight] = useHeight();
  const [contentHeight] = useHeight(FOOTER_CONTENT_MIN_HEIGHT);

  useEffect(() => () => restoreFocusOnSwapModal(), [restoreFocusOnSwapModal]);
  useAndroidDisableGesturesOnFocus();

  const keyboardOffset = keyboardHeight + insets.bottom + 10;

  const sheetHeightWithoutKeyboard =
    SheetHandleFixedToTopHeight +
    contentHeight +
    slippageMessageHeight +
    footerHeight +
    30;

  const sheetHeightWithKeyboard =
    sheetHeightWithoutKeyboard + keyboardHeight - 23;

  const additionalScrollForKeyboard =
    sheetHeightWithoutKeyboard + keyboardOffset >
    deviceHeight - insets.top + insets.bottom
      ? deviceHeight -
        insets.top +
        insets.bottom -
        (sheetHeightWithoutKeyboard + keyboardOffset)
      : 0;

  const contentScroll = useSharedValue(0);

  useEffect(() => {
    if (isKeyboardVisible) {
      contentScroll.value = withSpring(
        additionalScrollForKeyboard,
        springConfig
      );
      setParams({ longFormHeight: sheetHeightWithKeyboard });
    } else {
      contentScroll.value = withSpring(0, springConfig);
      setParams({ longFormHeight: sheetHeightWithoutKeyboard });
    }
  }, [
    additionalScrollForKeyboard,
    contentScroll,
    isKeyboardVisible,
    sheetHeightWithKeyboard,
    sheetHeightWithoutKeyboard,
    setParams,
  ]);

  const [currentGasTrend] = useState('stable');
  const { selectedGasPrice } = useGas();

  return (
    <SheetKeyboardAnimation
      as={AnimatedContainer}
      isKeyboardVisible={isKeyboardVisible}
      translateY={contentScroll}
    >
      <SlackSheet
        additionalTopPadding={android}
        borderRadius={39}
        contentHeight={ios ? longFormHeight : sheetHeightWithoutKeyboard}
      >
        {/* <Header>
          <SheetTitle weight="heavy">Custom Gas</SheetTitle>
        </Header> */}
        <PanelWrapper>
          <FeesPanel
            currentGasTrend={currentGasTrend}
            selectedGasPrice={selectedGasPrice}
            // setMaxBaseFee={setMaxBaseFee}
            // setMinerTip={setMinerTip}
          />
          <Divider />
          <FeesPanelTabs />
        </PanelWrapper>
        <Footer onLayout={setFooterHeight}>
          <Column
            justify="center"
            marginHorizontal={5}
            width={deviceWidth - 10}
          >
            <GasSpeedButton
              currentNetwork={network}
              hideDropdown
              onCustomGasBlur={hideKeyboard}
              onCustomGasFocus={showKeyboard}
              testID="swap-details-gas"
              theme="light"
            />
          </Column>
        </Footer>
      </SlackSheet>
    </SheetKeyboardAnimation>
  );
}
