import React from 'react';
import { DerivedValue } from 'react-native-reanimated';
import { Box } from '@/design-system';
import { GasSpeed } from '@/__swaps__/types/gas';
import { EstimatedGasFee } from './EstimatedGasFee';
import { GasMenu } from './GasMenu';
import { SelectedGasSpeed } from './SelectedGasSpeed';

type GasButtonProps = {
  onSelectGasSpeed: (gasSpeed: GasSpeed) => void;
  isFetching: DerivedValue<boolean>;
};

export function GasButton({ onSelectGasSpeed, isFetching }: GasButtonProps) {
  return (
    <GasMenu onSelectGasSpeed={onSelectGasSpeed}>
      <Box gap={12}>
        <SelectedGasSpeed />
        <EstimatedGasFee isFetching={isFetching} />
      </Box>
    </GasMenu>
  );
}
