import { useIsFocused, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import Divider from '../Divider';
import { ExchangeHeader } from '../exchange';
import { FloatingPanel } from '../floating-panels';
import { GasSpeedButton } from '../gas';
import { Column } from '../layout';
import { SlackSheet } from '../sheet';
import { FeesPanel, FeesPanelTabs } from './custom-gas';
import { getTrendKey } from '@rainbow-me/helpers/gas';
import {
  useAccountSettings,
  useBooleanState,
  useColorForAsset,
  useDimensions,
  useGas,
  useHeight,
  useKeyboardHeight,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { margin } from '@rainbow-me/styles';

const springConfig = {
  damping: 500,
  mass: 3,
  stiffness: 1000,
};

const FOOTER_MIN_HEIGHT = 60;
const CONTENT_MIN_HEIGHT = 330;

function useAndroidDisableGesturesOnFocus() {
  const { params } = useRoute();
  const isFocused = useIsFocused();
  useEffect(() => {
    android && params?.toggleGestureEnabled?.(!isFocused);
  }, [isFocused, params]);
}

const FeesPanelWrapper = styled(Column)`
  ${margin(18, 19, 29, 24)}
`;

const FeesPanelTabswrapper = styled(Column)`
  ${margin(19, 0, 24, 0)}
`;

export default function CustomGasState({ asset }) {
  const { network } = useAccountSettings();
  const { setParams } = useNavigation();
  const { params: { longFormHeight, speeds } = {} } = useRoute();
  const { colors } = useTheme();
  const { height: deviceHeight } = useDimensions();
  const keyboardHeight = useKeyboardHeight();
  const [isKeyboardVisible, showKeyboard, hideKeyboard] = useBooleanState();
  const insets = useSafeArea();
  const [footerHeight, setFooterHeight] = useHeight(FOOTER_MIN_HEIGHT);
  const [contentHeight, setContentHeight] = useHeight(CONTENT_MIN_HEIGHT);
  const contentScroll = useSharedValue(0);
  const colorForAsset = useColorForAsset(asset || {}, null, false, true);
  const { selectedGasFee, currentBlockParams } = useGas();
  const [canGoBack, setCanGoBack] = useState(true);

  const validateGasParams = useRef(null);
  useAndroidDisableGesturesOnFocus();

  const keyboardOffset = keyboardHeight + insets.bottom + 10;
  const sheetHeightWithoutKeyboard =
    contentHeight + footerHeight + (android ? 10 : 0);

  const sheetHeightWithKeyboard =
    sheetHeightWithoutKeyboard + keyboardHeight + (android ? 0 : -28);

  const additionalScrollForKeyboard =
    sheetHeightWithoutKeyboard + keyboardOffset >
    deviceHeight - insets.top + insets.bottom
      ? deviceHeight -
        insets.top +
        insets.bottom -
        (sheetHeightWithoutKeyboard + keyboardOffset)
      : 0;

  const currentGasTrend = useMemo(
    () => getTrendKey(currentBlockParams?.trend),
    [currentBlockParams?.trend]
  );

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
  return (
    <SlackSheet
      additionalTopPadding
      backgroundColor={colors.shadowBlack}
      borderBottomRadius={0}
      contentHeight={longFormHeight}
      deviceHeight={deviceHeight}
      hideHandle
      radius={39}
      removeTopPadding
      scrollEnabled={false}
    >
      <FloatingPanel onLayout={setContentHeight} radius={android ? 30 : 39}>
        <ExchangeHeader testID="custom-gas" />
        <FeesPanelWrapper>
          <FeesPanel
            asset={asset}
            colorForAsset={colorForAsset}
            currentGasTrend={currentGasTrend}
            onCustomGasBlur={hideKeyboard}
            onCustomGasFocus={showKeyboard}
            selectedGasFee={selectedGasFee}
            setCanGoBack={setCanGoBack}
            speeds={speeds}
            validateGasParams={validateGasParams}
          />
        </FeesPanelWrapper>
        <Divider color={colors.rowDividerExtraLight} inset={[0, 24, 0, 24]} />
        <FeesPanelTabswrapper>
          <FeesPanelTabs
            colorForAsset={colorForAsset}
            onPressTabPill={hideKeyboard}
            speeds={speeds}
          />
        </FeesPanelTabswrapper>
      </FloatingPanel>
      <Column onLayout={setFooterHeight}>
        <GasSpeedButton
          asset={asset}
          canGoBack={canGoBack}
          currentNetwork={network}
          showGasOptions
          testID="swap-details-gas"
          theme="dark"
          validateGasParams={validateGasParams}
        />
      </Column>
    </SlackSheet>
  );
}
