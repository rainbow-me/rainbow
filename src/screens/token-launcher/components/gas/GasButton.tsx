import React from 'react';
import { Box } from '@/design-system';
import { useGasSettings } from '@/__swaps__/screens/Swap/hooks/useSelectedGas';
import { GasMenu } from './GasMenu';
import { GasSpeed } from '@/__swaps__/types/gas';
import { SelectedGasSpeed } from './SelectedGasSpeed';
import { EstimatedGasFee } from './EstimatedGasFee';
import { ChainId } from '@/state/backendNetworks/types';

type GasButtonProps = {
  gasSpeed: GasSpeed;
  chainId: ChainId;
  gasLimit: string;
  onSelectGasSpeed: (gasSpeed: GasSpeed) => void;
};

export function GasButton({ gasSpeed, chainId, onSelectGasSpeed, gasLimit }: GasButtonProps) {
  const gasSettings = useGasSettings(chainId, gasSpeed);

  return (
    <GasMenu chainId={chainId} onSelectGasSpeed={onSelectGasSpeed}>
      <Box gap={12}>
        <SelectedGasSpeed selectedGasSpeed={gasSpeed} />
        <EstimatedGasFee chainId={chainId} gasSettings={gasSettings} gasLimit={gasLimit} />
      </Box>
    </GasMenu>
  );
}
