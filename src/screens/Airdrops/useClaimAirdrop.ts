import { useCallback, useRef, useMemo, MutableRefObject } from 'react';
import { runOnJS, SharedValue, useSharedValue } from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { useAccountSettings } from '@/hooks';
import { RainbowError, logger } from '@/logger';
import { RainbowClaimable } from '@/resources/addys/claimables/types';
import { FULL_PAGE_SIZE, useAirdropsStore } from '@/state/claimables/airdropsStore';
import { GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { useGasSettings } from '@/__swaps__/screens/Swap/hooks/useSelectedGas';
import { GasSpeed } from '@/__swaps__/types/gas';
import { MeteorologyGasSuggestions } from '@/__swaps__/utils/meteorology';
import { GasInfo, getAirdropClaimGasLimit, executeAirdropClaim, getGasInfo } from './utils';
import { time } from '@/utils';

export interface AirdropGasInfo extends GasInfo {
  lastUpdated: number;
}

export enum ClaimStatus {
  CLAIMING = 'claiming',
  INSUFFICIENT_GAS = 'insufficientGas',
  NOT_READY = 'notReady',
  READY = 'ready',
  RECOVERABLE_ERROR = 'recoverableError',
  SUCCESS = 'success',
  UNRECOVERABLE_ERROR = 'unrecoverableError',
}

const GAS_SPEED = GasSpeed.FAST;
const INITIAL_GAS_INFO: AirdropGasInfo = {
  gasFeeDisplay: undefined,
  gasLimit: undefined,
  lastUpdated: 0,
  sufficientFundsForGas: false,
};

export function useClaimAirdrop(claimable: RainbowClaimable) {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const gasSettingsRef = useRef<MeteorologyGasSuggestions[typeof GAS_SPEED] | 'disabled' | undefined>(undefined);
  const claimStatus = useSharedValue<ClaimStatus>(ClaimStatus.NOT_READY);
  const gasInfo = useSharedValue<AirdropGasInfo>(INITIAL_GAS_INFO);

  const updateGasInfo = useCallback(
    async (gasSettings: MeteorologyGasSuggestions | undefined) => {
      if (!accountAddress || !gasSettings) return;
      try {
        const gasLimit = await getAirdropClaimGasLimit(claimable, accountAddress);
        if (!gasLimit) {
          gasInfo.modify(prev => {
            'worklet';
            return { ...prev, gasLimit: undefined, isSufficientGas: false, lastUpdated: Date.now() };
          });
          return;
        }

        const updatedGasInfo = await getGasInfo({
          chainId: claimable.chainId,
          gasLimit,
          gasSettings: gasSettings[GAS_SPEED],
          nativeCurrency,
        });

        gasInfo.modify(prev => {
          'worklet';
          return { ...prev, ...updatedGasInfo, lastUpdated: Date.now() };
        });

        if (updatedGasInfo.sufficientFundsForGas && claimStatus.value === ClaimStatus.NOT_READY) {
          claimStatus.value = ClaimStatus.READY;
        } else if (!updatedGasInfo.sufficientFundsForGas && claimStatus.value === ClaimStatus.READY) {
          claimStatus.value = ClaimStatus.INSUFFICIENT_GAS;
        }
      } catch (error) {
        logger.warn('[useClaimAirdrop]: Failed to update gas info', { error });
      }
    },
    [accountAddress, claimable, claimStatus, gasInfo, nativeCurrency]
  );

  useGasSettings(
    claimable.chainId,
    GAS_SPEED,
    useMemo(
      () => ({
        notifyOnChangeProps: [],
        onSuccess: gasSettings => {
          if (gasSettingsRef.current === 'disabled') return;
          gasSettingsRef.current = gasSettings[GAS_SPEED];
          updateGasInfo(gasSettings);
        },
        // Ensure onSuccess is always run on mount
        staleTime: 0,
      }),
      [updateGasInfo]
    )
  );

  const executeClaim = useCallback(
    (gasInfo: AirdropGasInfo) => {
      if (gasSettingsRef.current === 'disabled') return;
      if (!gasInfo.gasLimit || !gasInfo.sufficientFundsForGas || !gasSettingsRef.current) {
        triggerHaptics('notificationError');
        claimStatus.value = ClaimStatus.RECOVERABLE_ERROR;
        return;
      }

      handleAndExecuteClaim({
        accountAddress,
        claimable,
        claimStatus,
        gasLimit: gasInfo.gasLimit,
        gasSettings: gasSettingsRef.current,
        gasSettingsRef,
      });
    },
    [accountAddress, claimable, claimStatus]
  );

  const claimAirdropWorklet = useCallback(() => {
    'worklet';
    if (claimStatus.value !== ClaimStatus.READY && claimStatus.value !== ClaimStatus.RECOVERABLE_ERROR) {
      return;
    }
    claimStatus.value = ClaimStatus.CLAIMING;
    runOnJS(executeClaim)(gasInfo.value);
  }, [claimStatus, executeClaim, gasInfo]);

  return useMemo(
    () => ({
      claimAirdropWorklet,
      claimStatus,
      gasInfo,
    }),
    [claimAirdropWorklet, claimStatus, gasInfo]
  );
}

async function handleAndExecuteClaim({
  accountAddress,
  claimStatus,
  claimable,
  gasLimit,
  gasSettings,
  gasSettingsRef,
}: {
  accountAddress: string;
  claimStatus: SharedValue<ClaimStatus>;
  claimable: RainbowClaimable;
  gasLimit: string;
  gasSettings: GasSettings;
  gasSettingsRef: MutableRefObject<MeteorologyGasSuggestions[typeof GAS_SPEED] | 'disabled' | undefined>;
}): Promise<void> {
  try {
    logger.log('[useClaimAirdrop]: Executing claim transaction', {
      claimable: claimable.uniqueId,
      chainId: claimable.chainId,
    });

    const result = await executeAirdropClaim({
      accountAddress,
      claimable,
      gasLimit,
      gasSettings,
    });

    if (result.success) {
      claimStatus.value = ClaimStatus.SUCCESS;
      triggerHaptics('notificationSuccess');
      gasSettingsRef.current = 'disabled';
      setTimeout(() => {
        useAirdropsStore.getState().fetch({ pageSize: FULL_PAGE_SIZE }, { staleTime: time.seconds(10) });
      }, time.seconds(5));
      logger.log('[useClaimAirdrop]: Claim transaction successful');
    } else {
      claimStatus.value = ClaimStatus.RECOVERABLE_ERROR;
      triggerHaptics('notificationError');
      logger.warn('[useClaimAirdrop]: Claim transaction failed', { error: result.error });
    }
  } catch (error) {
    claimStatus.value = ClaimStatus.RECOVERABLE_ERROR;
    triggerHaptics('notificationError');
    logger.error(new RainbowError('[useClaimAirdrop]: Unhandled error during claim'), { error });
  }
}
