import React, { useState } from 'react';
import { Box } from '@/design-system';
import { useGasSettings } from '@/__swaps__/screens/Swap/hooks/useSelectedGas';
import { useTokenLauncherStore } from '../../state/tokenLauncherStore';
import { GasMenu } from './GasMenu';
import { GasSpeed } from '@/__swaps__/types/gas';
import { SelectedGasSpeed } from './SelectedGasSpeed';
import { EstimatedGasFee } from './EstimatedGasFee';

// TODO: add callback to store selected gas speed
export function GasButton() {
  const chainId = useTokenLauncherStore(s => s.chainId);
  const [selectedGasSpeed, setSelectedGasSpeed] = useState<GasSpeed>(GasSpeed.FAST);
  const gasSettings = useGasSettings(chainId, selectedGasSpeed);
  // TODO: gas limit should be fixed depending on if launchToken or launchTokenAndBuy. Should likely come from sdk
  const gasLimit = '1000000';

  return (
    <GasMenu chainId={chainId} onSelectGasSpeed={setSelectedGasSpeed}>
      <Box gap={12}>
        <SelectedGasSpeed selectedGasSpeed={selectedGasSpeed} />
        <EstimatedGasFee chainId={chainId} gasSettings={gasSettings} gasLimit={gasLimit} />
      </Box>
    </GasMenu>
  );
}
