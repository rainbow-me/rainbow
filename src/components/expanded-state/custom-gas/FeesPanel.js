import { get } from 'lodash';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Column, Row } from '../../layout';
import { Text } from '../../text';
import FeesGweiInput from './FeesGweiInput';
import { padding } from '@rainbow-me/styles';
import { gasUtils } from '@rainbow-me/utils';

Text;

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

const MAX_GAS_FEE_VAR_AMOUNT = 1;
const MAX_FEE_PRIORITY_FEE_VAR_AMOUNT = 0.5;

export default function FeesPanel({
  currentGasTrend,
  selectedGasFee,
  updateGasFee,
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

  const addMinerTip = useCallback(
    () =>
      updateGasFee({
        priorityFeePerGas: MAX_FEE_PRIORITY_FEE_VAR_AMOUNT,
      }),
    [updateGasFee]
  );

  const substMinerTip = useCallback(
    () =>
      updateGasFee({
        priorityFeePerGas: -MAX_FEE_PRIORITY_FEE_VAR_AMOUNT,
      }),
    [updateGasFee]
  );

  const addMaxFee = useCallback(
    () => updateGasFee({ feePerGas: MAX_GAS_FEE_VAR_AMOUNT }),
    [updateGasFee]
  );

  const substMaxFee = useCallback(
    () => updateGasFee({ feePerGas: -MAX_GAS_FEE_VAR_AMOUNT }),
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
