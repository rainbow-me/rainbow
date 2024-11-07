import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccountSettings } from '@/hooks';
import { haptics } from '@/utils';
import { Claimable } from '@/resources/addys/claimables/types';
import { estimateGasWithPadding, getProvider } from '@/handlers/web3';
import { getNextNonce } from '@/state/nonces';
import { logger, RainbowError } from '@/logger';
import { convertAmountToNativeDisplayWorklet, convertAmountToRawAmount, formatNumber, multiply } from '@/__swaps__/utils/numbers';
import { useMutation } from '@tanstack/react-query';
import { loadWallet } from '@/model/wallet';
import { walletExecuteRap } from '@/raps/execute';
import { claimablesQueryKey } from '@/resources/addys/claimables/query';
import { queryClient } from '@/react-query';
import { ETH_ADDRESS } from '@rainbow-me/swaps';
import { useMeteorologySuggestion } from '@/__swaps__/utils/meteorology';
import { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities';
import { getGasSettingsBySpeed, useGasSettings } from '@/__swaps__/screens/Swap/hooks/useSelectedGas';
import { GasSpeed } from '@/__swaps__/types/gas';
import { Box } from '@/design-system';
import { ClaimPanel } from '../../shared/components/ClaimPanel';
import { ClaimValueDisplay } from '../../shared/components/ClaimValueDisplay';
import { ClaimCustomization } from './ClaimCustomization';
import { ClaimButton } from '../../shared/components/ClaimButton';
import { GasDetails } from './GasDetails';
import { TransactionClaimableTxPayload } from '../types';
import { externalTokenQueryKey, fetchExternalToken, FormattedExternalAsset } from '@/resources/assets/externalAssetsQuery';
import { useTransactionClaimableContext } from '../context/TransactionClaimableContext';
import { executeClaim } from '../utils';
import { calculateGasFeeWorklet } from '@/__swaps__/screens/Swap/providers/SyncSwapStateAndSharedValues';
import { add, divide } from '@/helpers/utilities';
import { useUserNativeNetworkAsset } from '@/resources/assets/useUserAsset';
import { lessThanOrEqualToWorklet } from '@/__swaps__/safe-math/SafeMath';
import { useSwapEstimatedGasLimit } from '@/__swaps__/screens/Swap/hooks/useSwapEstimatedGasLimit';
import { safeBigInt } from '@/__swaps__/screens/Swap/hooks/useEstimatedGasFee';
import { useTokenSearch } from '@/__swaps__/screens/Swap/resources/search';
import { SearchAsset } from '@/__swaps__/types/search';
import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { weiToGwei } from '@/__swaps__/utils/ethereum';
import { formatUnits } from 'viem';
import { useClaimButtonProps } from '../hooks/useClaimButtonProps';

export function TransactionClaimableFlow() {
  const {
    claimable,
    outputConfig: { chainId: outputChainId, token: outputToken },
    claimStatus,
    setClaimStatus,
    quote,
    claimNativeValueDisplay,
  } = useTransactionClaimableContext();

  const { onPress, disabled, shimmer, biometricIcon, label } = useClaimButtonProps();

  return (
    <ClaimPanel claimStatus={claimStatus} iconUrl={claimable.iconUrl}>
      <Box gap={20} alignItems="center">
        <ClaimValueDisplay
          label={claimNativeValueDisplay}
          tokenIconUrl={outputToken?.iconUrl}
          tokenSymbol={outputToken?.symbol}
          chainId={outputChainId}
        />
        <ClaimCustomization />
      </Box>
      <Box alignItems="center" width="full">
        <ClaimButton onPress={onPress} disabled={disabled} shimmer={shimmer} biometricIcon={biometricIcon} label={label} />
        <GasDetails />
      </Box>
    </ClaimPanel>
  );
}
