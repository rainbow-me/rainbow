import React, { memo } from 'react';
import { Inline, TextIcon, TextProps } from '@/design-system';
import { DerivedValue, SharedValue } from 'react-native-reanimated';
import { GasFeeText } from './GasFeeText';
import { usePerpsDepositContext } from '@/features/perps/screens/perps-deposit-withdraw-screen/PerpsDepositContext';
import { useNativeAsset } from '@/utils/ethereumUtils';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';

type EstimatedGasFeeProps = {
  isFetching: SharedValue<boolean>;
} & Partial<Pick<TextProps, 'color' | 'size' | 'tabularNumbers' | 'weight'>>;

export function EstimatedGasFee({ color = 'labelTertiary', isFetching, size = '15pt', weight = 'bold' }: EstimatedGasFeeProps) {
  const { gasStores, useDepositStore } = usePerpsDepositContext();
  const chainId = useDepositStore(state => state.getAssetChainId());
  const nativeNetworkAsset = useNativeAsset({ chainId });
  const estimatedGasFee = useStoreSharedValue(gasStores.useGasFeeEstimator, estimate => estimate(nativeNetworkAsset) ?? '--');

  return <EstimatedGasFeeContent color={color} isFetching={isFetching} label={estimatedGasFee} size={size} weight={weight} />;
}

const EstimatedGasFeeContent = memo(function EstimatedGasFeeContent({
  color,
  isFetching,
  label,
  size,
  weight,
}: Required<Pick<EstimatedGasFeeProps, 'color' | 'isFetching' | 'size' | 'weight'>> & { label: DerivedValue<string> }) {
  return (
    <Inline alignVertical="center" space="4px">
      <TextIcon color="labelQuaternary" height={10} size="icon 11px" weight="heavy" width={18}>
        􀵟
      </TextIcon>
      <GasFeeText color={color} isFetching={isFetching} label={label} size={size} weight={weight} />
    </Inline>
  );
});
