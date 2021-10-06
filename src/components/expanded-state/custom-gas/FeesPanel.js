import { get } from 'lodash';
import React from 'react';
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

export default function FeesPanel({
  currentGasTrend,
  setMaxBaseFee,
  selectedGasFee,
  setMinerTip,
}) {
  const maxFee = get(selectedGasFee, 'gasFees.maxFee.native.value.display', 0);
  const currentBaseFee = get(
    selectedGasFee,
    'gasFeeParams.baseFeePerGas.display',
    0
  );
  const maxBaseFee = get(selectedGasFee, 'gasFeeParams.maxFeePerGas.gwei', 0);
  const minerTip = get(
    selectedGasFee,
    'gasFeeParams.priorityFeePerGas.gwei',
    0
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
            <FeesGweiInput setValue={setMaxBaseFee} value={maxBaseFee} />
          </PanelColumn>
        </PanelRow>
        {/* miner tip */}
        <PanelRow>
          <PanelColumn>
            <PanelLabel>Miner Tip</PanelLabel>
          </PanelColumn>
          <PanelColumn>
            <FeesGweiInput setValue={setMinerTip} value={minerTip} />
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
