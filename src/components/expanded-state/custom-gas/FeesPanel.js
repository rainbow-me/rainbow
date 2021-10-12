import { get } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

const PanelWarning = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.yellowFavorite,
  size: 'smedium',
  weight: 'heavy',
}))`
  position: absolute;
  bottom: 0;
`;

const PanelError = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.red,
  size: 'smedium',
  weight: 'heavy',
}))`
  position: absolute;
  bottom: 0;
`;

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

const calculateMinerTipAddDifference = maxPriorityFee => {
  const diff =
    Math.round((maxPriorityFee % PRIORITY_FEE_INCREMENT) * 100) / 100;
  if (diff > PRIORITY_FEE_INCREMENT - PRIORITY_FEE_THRESHOLD) {
    return 2 * PRIORITY_FEE_INCREMENT - diff;
  } else {
    return PRIORITY_FEE_INCREMENT - diff;
  }
};

const calculateMinerTipSubstDifference = maxPriorityFee => {
  const diff =
    Math.round((maxPriorityFee % PRIORITY_FEE_INCREMENT) * 100) / 100;
  if (diff < PRIORITY_FEE_THRESHOLD) {
    return PRIORITY_FEE_INCREMENT + diff;
  } else {
    return diff || PRIORITY_FEE_INCREMENT;
  }
};

export default function FeesPanel({
  currentGasTrend,
  colorForAsset,
  onCustomGasFocus,
}) {
  const {
    selectedGasFee,
    updateToCustomGasFee,
    gasFeeParamsBySpeed,
  } = useGas();

  const [customMaxPriorityFee, setCustomMaxPriorityFee] = useState(
    get(selectedGasFee, 'gasFeeParams.maxPriorityFeePerGas.gwei', 0)
  );
  const [customMaxBaseFee, setCustomMaxBaseFee] = useState(
    get(selectedGasFee, 'gasFeeParams.maxFeePerGas.gwei', 0)
  );
  const [maxPriorityFeeWarning, setMaxPriorityFeeWarning] = useState(null);
  const [maxPriorityFeeError, setMaxPriorityFeeError] = useState(null);

  const [maxBaseFeeWarning, setMaxBaseFeeWarning] = useState(null);
  const [maxBaseFeeError, setMaxBaseFeeError] = useState(null);

  const { maxFee, currentBaseFee, maxBaseFee, maxPriorityFee } = useMemo(() => {
    const maxFee = get(selectedGasFee, 'gasFee.maxFee.native.value.display', 0);
    const currentBaseFee = get(
      selectedGasFee,
      'gasFeeParams.baseFeePerGas.gwei',
      0
    );
    let maxBaseFee;
    if (selectedGasFee?.option === 'custom') {
      // block more thn 2 decimals on gwei value
      const decimals = Number(customMaxBaseFee) % 1;
      maxBaseFee =
        `${decimals}`.length > 4
          ? parseInt(customMaxBaseFee, 10)
          : customMaxBaseFee;
    } else {
      maxBaseFee = parseInt(
        get(selectedGasFee, 'gasFeeParams.maxFeePerGas.gwei', 0),
        10
      );
    }

    let maxPriorityFee;
    if (selectedGasFee?.option === 'custom') {
      // block more thn 2 decimals on gwei value
      const decimals = Number(customMaxPriorityFee) % 1;
      maxPriorityFee =
        `${decimals}`.length > 4
          ? Number(customMaxPriorityFee).toFixed(2)
          : customMaxPriorityFee;
    } else {
      maxPriorityFee = get(
        selectedGasFee,
        'gasFeeParams.maxPriorityFeePerGas.gwei',
        0
      );
    }
    return { currentBaseFee, maxBaseFee, maxFee, maxPriorityFee };
  }, [customMaxBaseFee, customMaxPriorityFee, selectedGasFee]);

  const formattedBaseFee = useMemo(() => `${parseInt(currentBaseFee)} Gwei`, [
    currentBaseFee,
  ]);

  useEffect(() => {
    // validate not zero
    if (!maxBaseFee || maxBaseFee === '0') {
      setMaxBaseFeeError('1 Gwei to avoid failure');
    } else {
      setMaxBaseFeeError(null);
    }
    if (maxBaseFee < currentBaseFee) {
      setMaxBaseFeeWarning('Lower than recommended');
    } else if (maxBaseFee > 3 * currentBaseFee) {
      setMaxBaseFeeWarning('Higher than necessary');
    } else {
      setMaxBaseFeeWarning(null);
    }
  }, [maxBaseFee, currentBaseFee, gasFeeParamsBySpeed.normal]);

  useEffect(() => {
    // validate not zero
    if (!maxPriorityFee || maxPriorityFee === '0') {
      setMaxPriorityFeeError('1 Gwei to avoid failure');
    } else {
      setMaxPriorityFeeError(null);
    }
    if (
      maxPriorityFee < gasFeeParamsBySpeed?.normal?.maxPriorityFeePerGas?.gwei
    ) {
      setMaxPriorityFeeWarning('Lower than recommended');
    } else if (
      maxPriorityFee >
      2 * gasFeeParamsBySpeed?.urgent?.maxPriorityFeePerGas?.gwei
    ) {
      setMaxPriorityFeeWarning('Higher than necessary');
    } else {
      setMaxPriorityFeeWarning(null);
    }
  }, [
    maxBaseFee,
    currentBaseFee,
    maxPriorityFee,
    gasFeeParamsBySpeed?.urgent?.maxPriorityFeePerGas?.gwei,
    gasFeeParamsBySpeed?.normal?.maxPriorityFeePerGas?.gwei,
  ]);

  const handleCustomGasFocus = useCallback(() => {
    onCustomGasFocus?.();
  }, [onCustomGasFocus]);

  const updateGasFee = useCallback(
    ({ priorityFeePerGas = 0, feePerGas = 0 }) => {
      const {
        gasFeeParams: { maxFeePerGas, maxPriorityFeePerGas },
      } = selectedGasFee;
      const gweiMaxPriorityFeePerGas = maxPriorityFeePerGas.gwei || 0;
      const gweiMaxFeePerGas = maxFeePerGas.gwei || 0;

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

      if (newMaxPriorityFeePerGas.amount < 0 || newMaxFeePerGas.amount < 0)
        return;

      setCustomMaxPriorityFee(newMaxPriorityFeePerGas.gwei);
      setCustomMaxBaseFee(parseInt(newMaxFeePerGas.gwei));

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
      priorityFeePerGas: calculateMinerTipAddDifference(maxPriorityFee),
    });
  }, [updateGasFee, maxPriorityFee]);

  const substMinerTip = useCallback(() => {
    updateGasFee({
      priorityFeePerGas: -calculateMinerTipSubstDifference(maxPriorityFee),
    });
  }, [updateGasFee, maxPriorityFee]);

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

      if (newMaxFeePerGas.amount < 0) return;

      setCustomMaxBaseFee(text);

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
      if (newMaxPriorityFeePerGas.amount < 0) return;

      setCustomMaxPriorityFee(text);

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
            <PanelLabel>{formattedBaseFee}</PanelLabel>
          </PanelColumn>
        </PanelRow>
        {/* max base fee */}
        <PanelRow>
          <PanelColumn>
            <PanelLabel>Max Base Fee</PanelLabel>
          </PanelColumn>
          {(maxBaseFeeError && <PanelError>{maxBaseFeeError}</PanelError>) ||
            (maxBaseFeeWarning && (
              <PanelWarning>{maxBaseFeeWarning}</PanelWarning>
            ))}

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
          {(maxPriorityFeeError && (
            <PanelError>{maxPriorityFeeError}</PanelError>
          )) ||
            (maxPriorityFeeWarning && (
              <PanelWarning>{maxPriorityFeeWarning}</PanelWarning>
            ))}

          <PanelColumn>
            <FeesGweiInput
              buttonColor={colorForAsset}
              minusAction={substMinerTip}
              onChange={onMinerTipChange}
              onPress={handleCustomGasFocus}
              plusAction={addMinerTip}
              value={maxPriorityFee}
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
