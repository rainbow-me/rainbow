import { get } from 'lodash';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Column, Row } from '../../layout';
import { Text } from '../../text';
import FeesGweiInput from './FeesGweiInput';
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
  selectedGasFee,
  updateGasFee,
  colorForAsset,
}) {
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
