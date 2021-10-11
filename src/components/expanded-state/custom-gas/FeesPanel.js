import { get } from 'lodash';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Column, Row } from '../../layout';
import { Text } from '../../text';
import FeesGweiInput from './FeesGweiInput';
import { useGas } from '@rainbow-me/hooks';
import { gweiToWei, parseGasFeeParam } from '@rainbow-me/parsers';
import { padding } from '@rainbow-me/styles';
import { gasUtils } from '@rainbow-me/utils';

const OuterWrapper = styled.View`
  margin-top: 0px;
`;

const InnerWrapper = styled.View`
  ${padding(10, 24)}
`;

const PanelRow = styled(Row).attrs({
  alignItems: 'center',
  justify: 'space-between',
})`
  ${padding(10, 0)}
`;
const PanelRowThin = styled(Row).attrs({
  justify: 'space-between',
})`
  ${padding(0, 0)}
`;

const PanelLabel = styled(Text).attrs({
  size: 'lmedium',
  weight: 'heavy',
})``;
const GasTrendHeader = styled(Text).attrs(({ theme: { colors }, color }) => ({
  color: color || colors.appleBlue,
  size: 'smedium',
  weight: 'heavy',
}))`
  padding-bottom: 0;
`;

const PanelColumn = styled(Column).attrs(() => ({
  justify: 'center',
}))``;

const GAS_FEE_INCREMENT = 1;
const PRIORITY_FEE_INCREMENT = 0.5;
const PRIORITY_FEE_THRESHOLD = 0.15;

const calculateMinerTipAddDifference = minerTip => {
  const diff = Math.round((minerTip % PRIORITY_FEE_INCREMENT) * 100) / 100;
  if (diff > PRIORITY_FEE_INCREMENT - PRIORITY_FEE_THRESHOLD) {
    return 2 * PRIORITY_FEE_INCREMENT - diff;
  } else {
    return PRIORITY_FEE_INCREMENT - diff;
  }
};

const calculateMinerTipSubstDifference = minerTip => {
  const diff = Math.round((minerTip % PRIORITY_FEE_INCREMENT) * 100) / 100;
  if (diff < PRIORITY_FEE_THRESHOLD) {
    return PRIORITY_FEE_INCREMENT + diff;
  } else {
    return diff || PRIORITY_FEE_INCREMENT;
  }
};

export default function FeesPanel({
  currentGasTrend,
  colorForAsset,
  // onCustomGasBlur,
  onCustomGasFocus,
}) {
  const { selectedGasFee, updateToCustomGasFee } = useGas();

  const { maxFee, currentBaseFee, maxBaseFee, minerTip } = useMemo(() => {
    const maxFee = get(selectedGasFee, 'gasFee.maxFee.native.value.display', 0);
    const currentBaseFee = get(
      selectedGasFee,
      'gasFeeParams.baseFeePerGas.display',
      0
    );
    const maxBaseFee = parseInt(
      get(selectedGasFee, 'gasFeeParams.maxFeePerGas.gwei', 0),
      10
    );
    const minerTip = get(
      selectedGasFee,
      'gasFeeParams.maxPriorityFeePerGas.gwei',
      0
    );
    return { currentBaseFee, maxBaseFee, maxFee, minerTip };
  }, [selectedGasFee]);

  const handleCustomGasFocus = useCallback(() => {
    // setInputFocused(true);
    onCustomGasFocus?.();
  }, [onCustomGasFocus]);

  // const handleCustomGasBlur = useCallback(() => {
  //   // setInputFocused(false);
  //   onCustomGasBlur?.();
  // }, [onCustomGasBlur]);
  const updateGasFee = useCallback(
    ({ priorityFeePerGas = 0, feePerGas = 0 }) => {
      const {
        gasFeeParams: { maxFeePerGas, maxPriorityFeePerGas },
      } = selectedGasFee;
      const gweiMaxPriorityFeePerGas = maxPriorityFeePerGas.gwei;
      const gweiMaxFeePerGas = maxFeePerGas.gwei;

      const newGweiMaxPriorityFeePerGas =
        Math.round((gweiMaxPriorityFeePerGas + priorityFeePerGas) * 100) / 100;
      const newGweiMaxFeePerGas =
        Math.round((gweiMaxFeePerGas + feePerGas) * 100) / 100;

      const newMaxPriorityFeePerGas = parseGasFeeParam(
        Number(gweiToWei(newGweiMaxPriorityFeePerGas))
      );
      const newMaxFeePerGas = parseGasFeeParam(
        Number(gweiToWei(newGweiMaxFeePerGas))
      );

      const newGasParams = {
        ...selectedGasFee.gasFeeParams,
        maxFeePerGas: newMaxFeePerGas,
        maxPriorityFeePerGas: newMaxPriorityFeePerGas,
      };
      updateToCustomGasFee(newGasParams);
    },
    [selectedGasFee, updateToCustomGasFee]
  );

  const addMinerTip = useCallback(() => {
    updateGasFee({
      priorityFeePerGas: calculateMinerTipAddDifference(minerTip),
    });
  }, [updateGasFee, minerTip]);

  const substMinerTip = useCallback(() => {
    updateGasFee({
      priorityFeePerGas: -calculateMinerTipSubstDifference(minerTip),
    });
  }, [updateGasFee, minerTip]);

  const addMaxFee = useCallback(
    () => updateGasFee({ feePerGas: GAS_FEE_INCREMENT }),
    [updateGasFee]
  );

  const substMaxFee = useCallback(
    () => updateGasFee({ feePerGas: -GAS_FEE_INCREMENT }),
    [updateGasFee]
  );

  const onMaxBaseFeeChange = useCallback(
    ({ nativeEvent: { text } }) => {
      const maxFeePerGas = parseGasFeeParam(Number(gweiToWei(text)));
      const gweiMaxFeePerGas = maxFeePerGas.gwei;

      const newGweiMaxFeePerGas = Math.round(gweiMaxFeePerGas * 100) / 100;

      const newMaxFeePerGas = parseGasFeeParam(
        Number(gweiToWei(newGweiMaxFeePerGas))
      );

      const newGasParams = {
        ...selectedGasFee.gasFeeParams,
        maxFeePerGas: newMaxFeePerGas,
      };
      updateToCustomGasFee(newGasParams);
    },
    [selectedGasFee.gasFeeParams, updateToCustomGasFee]
  );

  const onMinerTipChange = useCallback(
    ({ nativeEvent: { text } }) => {
      const maxPriorityFeePerGas = parseGasFeeParam(Number(gweiToWei(text)));
      const gweiMaxPriorityFeePerGas = maxPriorityFeePerGas.gwei;

      const newGweiMaxPriorityFeePerGas =
        Math.round(gweiMaxPriorityFeePerGas * 100) / 100;

      const newMaxPriorityFeePerGas = parseGasFeeParam(
        Number(gweiToWei(newGweiMaxPriorityFeePerGas))
      );

      const newGasParams = {
        ...selectedGasFee.gasFeeParams,
        maxPriorityFeePerGas: newMaxPriorityFeePerGas,
      };
      updateToCustomGasFee(newGasParams);
    },
    [selectedGasFee.gasFeeParams, updateToCustomGasFee]
  );

  return (
    <OuterWrapper>
      <InnerWrapper>
        {/* current base fee */}
        <PanelRowThin>
          <PanelColumn />
          <PanelColumn>
            <GasTrendHeader color={gasUtils.GAS_TRENDS[currentGasTrend].color}>
              {gasUtils.GAS_TRENDS[currentGasTrend].label}
            </GasTrendHeader>
          </PanelColumn>
        </PanelRowThin>
        <PanelRow justify="space-between">
          <PanelColumn>
            <PanelLabel>Current Base Fee</PanelLabel>
          </PanelColumn>
          <PanelColumn>
            <PanelLabel>{`${currentBaseFee}`}</PanelLabel>
          </PanelColumn>
        </PanelRow>
        {/* max base fee */}
        <PanelRow>
          <PanelColumn>
            <PanelLabel>Max Base Fee</PanelLabel>
          </PanelColumn>
          <PanelColumn>
            <FeesGweiInput
              buttonColor={colorForAsset}
              minusAction={substMaxFee}
              onChange={onMaxBaseFeeChange}
              onPress={handleCustomGasFocus}
              plusAction={addMaxFee}
              value={maxBaseFee}
            />
          </PanelColumn>
        </PanelRow>
        {/* miner tip */}
        <PanelRow>
          <PanelColumn>
            <PanelLabel>Miner Tip</PanelLabel>
          </PanelColumn>
          <PanelColumn>
            <FeesGweiInput
              buttonColor={colorForAsset}
              minusAction={substMinerTip}
              onChange={onMinerTipChange}
              onPress={handleCustomGasFocus}
              plusAction={addMinerTip}
              value={minerTip}
            />
          </PanelColumn>
        </PanelRow>
        {/* max transaction fee */}
        <PanelRow>
          <PanelColumn>
            <PanelLabel>Max Transaction Fee</PanelLabel>
          </PanelColumn>
          <PanelColumn>
            <PanelLabel>{maxFee}</PanelLabel>
          </PanelColumn>
        </PanelRow>
      </InnerWrapper>
    </OuterWrapper>
  );
}
