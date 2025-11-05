import { useIsFocused, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import Divider from '@/components/Divider';
import { ExchangeHeader } from '@/components/ExchangeHeader';
import { FloatingPanel } from '../floating-panels';
import { GasSpeedButton } from '@/components/gas';
import { Column } from '@/components/layout';
import { SlackSheet } from '@/components/sheet';
import { getTrendKey } from '@/helpers/gas';
import { useColorForAsset, useGas, useKeyboardHeight } from '@/hooks';
import { useNavigation } from '@/navigation';
import styled from '@/styled-thing';
import { margin } from '@/styles';
import { deviceUtils } from '@/utils';
import FeesPanel from '@/components/FeesPanel';
import FeesPanelTabs from '@/components/FeesPanelTabs';
import { KeyboardType } from '@/helpers/keyboardTypes';

const FOOTER_HEIGHT = 79;
const CONTENT_HEIGHT = 342;

function useAndroidDisableGesturesOnFocus() {
  const { params } = useRoute();
  const isFocused = useIsFocused();
  useEffect(() => {
    android && params?.toggleGestureEnabled?.(!isFocused);
  }, [isFocused, params]);
}

const FeesPanelWrapper = styled(Column)(margin.object(19, 24, 29, 24));

const FeesPanelTabswrapper = styled(Column)(margin.object(19, 0, 24, 0));

// send sheet gas panel
export default function CustomGasState({ asset }) {
  const { setParams } = useNavigation();
  const { params: { longFormHeight, speeds, openCustomOptions, fallbackColor } = {} } = useRoute();
  const { colors } = useTheme();
  const keyboardHeight = useKeyboardHeight({ keyboardType: KeyboardType.numpad });
  const colorForAsset = useColorForAsset(asset || {}, fallbackColor, false, true);
  const { selectedGasFee, currentBlockParams, chainId } = useGas();
  const [canGoBack, setCanGoBack] = useState(true);

  const validateGasParams = useRef(null);
  useAndroidDisableGesturesOnFocus();

  const sheetHeightWithoutKeyboard = CONTENT_HEIGHT + FOOTER_HEIGHT;

  const sheetHeightWithKeyboard = sheetHeightWithoutKeyboard + keyboardHeight + (deviceUtils.isSmallPhone ? 30 : 0);

  const currentGasTrend = useMemo(() => getTrendKey(currentBlockParams?.trend), [currentBlockParams?.trend]);

  useEffect(() => {
    setParams({ longFormHeight: sheetHeightWithKeyboard });
  }, [sheetHeightWithKeyboard, setParams]);

  return (
    <SlackSheet
      additionalTopPadding
      hideHandle
      borderBottomRadius={0}
      removeTopPadding
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
          chainId={chainId}
          showGasOptions
          testID="swap-details-gas"
          theme="dark"
          validateGasParams={validateGasParams}
          marginTop={19}
        />
      </Column>
    </SlackSheet>
  );
}
