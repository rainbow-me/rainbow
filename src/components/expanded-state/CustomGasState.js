import { useIsFocused, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
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
  useColorForAsset,
  useDimensions,
  useGas,
  useKeyboardHeight,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { margin } from '@rainbow-me/styles';
import { deviceUtils } from '@rainbow-me/utils';

const FOOTER_HEIGHT = 76;
const CONTENT_HEIGHT = 310;

function useAndroidDisableGesturesOnFocus() {
  const { params } = useRoute();
  const isFocused = useIsFocused();
  useEffect(() => {
    android && params?.toggleGestureEnabled?.(!isFocused);
  }, [isFocused, params]);
}

const FeesPanelWrapper = styled(Column)`
  ${margin(13, 12, 30, 24)}
`;

const FeesPanelTabswrapper = styled(Column)`
  ${margin(19, 0, 24, 0)}
`;

export default function CustomGasState({ asset }) {
  const { network } = useAccountSettings();
  const { setParams } = useNavigation();
  const {
    params: { longFormHeight, speeds, openCustomOptions } = {},
  } = useRoute();
  const { colors } = useTheme();
  const { height: deviceHeight } = useDimensions();
  const keyboardHeight = useKeyboardHeight();
  const colorForAsset = useColorForAsset(asset || {}, null, false, true);
  const { selectedGasFee, currentBlockParams } = useGas();
  const [canGoBack, setCanGoBack] = useState(true);

  const validateGasParams = useRef(null);
  useAndroidDisableGesturesOnFocus();

  const sheetHeightWithoutKeyboard =
    CONTENT_HEIGHT +
    FOOTER_HEIGHT +
    (android ? 40 + getSoftMenuBarHeight() : 0);

  const sheetHeightWithKeyboard =
    sheetHeightWithoutKeyboard +
    keyboardHeight +
    (deviceUtils.isSmallPhone ? 30 : 0);

  const currentGasTrend = useMemo(
    () => getTrendKey(currentBlockParams?.trend),
    [currentBlockParams?.trend]
  );

  useEffect(() => {
    setParams({ longFormHeight: sheetHeightWithKeyboard });
  }, [sheetHeightWithKeyboard, setParams]);

  return (
    <SlackSheet
      additionalTopPadding
      hideHandle
      {...(ios && {
        borderBottomRadius: 0,
        deviceHeight,
        removeTopPadding: true,
      })}
      backgroundColor={colors.transparent}
      contentHeight={ios ? longFormHeight : deviceHeight - getStatusBarHeight()}
      radius={0}
      scrollEnabled={false}
    >
      <FloatingPanel radius={android ? 30 : 39}>
        <ExchangeHeader testID="custom-gas" />
        <FeesPanelWrapper>
          <FeesPanel
            colorForAsset={colorForAsset}
            currentGasTrend={currentGasTrend}
            openCustomOptions={openCustomOptions}
            selectedGasFee={selectedGasFee}
            setCanGoBack={setCanGoBack}
            speeds={speeds}
            validateGasParams={validateGasParams}
          />
        </FeesPanelWrapper>
        <Divider color={colors.rowDividerExtraLight} inset={[0, 24]} />
        <FeesPanelTabswrapper>
          <FeesPanelTabs colorForAsset={colorForAsset} speeds={speeds} />
        </FeesPanelTabswrapper>
      </FloatingPanel>
      <Column>
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
