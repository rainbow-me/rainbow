import React from 'react';
import { Inline, TextIcon, TextProps } from '@/design-system';
import { useDerivedValue } from 'react-native-reanimated';
import { GasFeeText } from './GasFeeText';
import { GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { useEstimatedGasFee } from '@/__swaps__/screens/Swap/hooks/useEstimatedGasFee';
import { ChainId } from '@/state/backendNetworks/types';

type EstimatedGasFeeProps = { chainId: ChainId; gasSettings?: GasSettings; gasLimit: string | undefined; isFetching?: boolean } & Partial<
  Pick<TextProps, 'align' | 'color' | 'size' | 'weight' | 'tabularNumbers'>
>;

export function EstimatedGasFee({
  chainId,
  gasSettings,
  gasLimit,
  color = 'labelTertiary',
  size = '15pt',
  weight = 'bold',
  isFetching = false,
}: EstimatedGasFeeProps) {
  const estimatedGasFee = useEstimatedGasFee({ chainId, gasLimit, gasSettings });
  const isFetchingShared = useDerivedValue(() => isFetching);

  const label = useDerivedValue(() => {
    return estimatedGasFee ?? '--';
  });

  return (
    <Inline alignVertical="center" space="4px">
      <TextIcon color="labelQuaternary" height={10} size="icon 11px" weight="heavy" width={18}>
        􀵟
      </TextIcon>
      <GasFeeText color={color} size={size} weight={weight} label={label} isFetching={isFetchingShared} />
    </Inline>
  );
}
