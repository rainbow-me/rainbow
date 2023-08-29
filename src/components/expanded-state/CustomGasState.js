import { useIsFocused, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import Divider from '../Divider';
import { ExchangeHeader } from '../exchange';
import { FloatingPanel } from '../floating-panels';
import { GasSpeedButton } from '../gas';
import { Column } from '../layout';
import { SlackSheet } from '../sheet';
import { FeesPanel, FeesPanelTabs } from './custom-gas';
import { getTrendKey } from '@/helpers/gas';
import {
  useAccountSettings,
  useColorForAsset,
  useDimensions,
  useGas,
  useKeyboardHeight,
} from '@/hooks';
import { useNavigation } from '@/navigation';
import styled from '@/styled-thing';
import { margin } from '@/styles';
import { deviceUtils } from '@/utils';
import { IS_ANDROID } from '@/env';
import { useSelector } from 'react-redux';
import { getCrosschainSwapServiceTime } from '@/handlers/swap';

const FOOTER_HEIGHT = 76;
const CONTENT_HEIGHT = 310;

function useAndroidDisableGesturesOnFocus() {
  const { params } = useRoute();
  const isFocused = useIsFocused();
  useEffect(() => {
    android && params?.toggleGestureEnabled?.(!isFocused);
  }, [isFocused, params]);
}

const FeesPanelWrapper = styled(Column)(margin.object(19, 24, 29, 24));

const FeesPanelTabswrapper = styled(Column)(margin.object(19, 0, 24, 0));

export default function CustomGasState({ asset }) {
  const { setParams } = useNavigation();
  const {
    params: { longFormHeight, speeds, openCustomOptions } = {},
  } = useRoute();
  const { colors } = useTheme();
  const { height: deviceHeight } = useDimensions();
  const keyboardHeight = useKeyboardHeight();
  const colorForAsset = useColorForAsset(asset || {}, null, false, true);
  const { selectedGasFee, currentBlockParams, txNetwork } = useGas();
  const [canGoBack, setCanGoBack] = useState(true);
  const { tradeDetails } = useSelector(state => state.swap);

  const validateGasParams = useRef(null);
  useAndroidDisableGesturesOnFocus();

  const sheetHeightWithoutKeyboard =
    CONTENT_HEIGHT +
    FOOTER_HEIGHT +
    (IS_ANDROID ? 20 + getSoftMenuBarHeight() : 0);

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
      contentHeight={longFormHeight}
      radius={0}
      scrollEnabled={false}
    >
      <FloatingPanel borderRadius={38}>
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
          currentNetwork={txNetwork}
          showGasOptions
          testID="swap-details-gas"
          theme="dark"
          validateGasParams={validateGasParams}
          marginTop={19}
          crossChainServiceTime={getCrosschainSwapServiceTime(tradeDetails)}
        />
      </Column>
    </SlackSheet>
  );
}
