import { GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { useGasSettings } from '@/__swaps__/screens/Swap/hooks/useSelectedGas';
import { GasSpeed } from '@/__swaps__/types/gas';
import { MeteorologyGasSuggestions } from '@/__swaps__/utils/meteorology';
import { logger, RainbowError } from '@/logger';
import { RainbowClaimable } from '@/resources/addys/claimables/types';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useAirdropsStore } from '@/state/claimables/airdropsStore';
import { staleBalancesStore } from '@/state/staleBalances';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { MutableRefObject, useCallback, useMemo, useRef } from 'react';
import { runOnJS, SharedValue, useSharedValue } from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { executeAirdropClaim, GasInfo, getAirdropClaimGasLimit, getGasInfo } from './utils';

export interface AirdropGasInfo extends GasInfo {
  lastUpdated: number;
}

export enum ClaimStatus {
  CLAIMING = 'claiming',
  CONFIRMED = 'confirmed',
  INSUFFICIENT_GAS = 'insufficientGas',
  NOT_READY = 'notReady',
  READY = 'ready',
  RECOVERABLE_ERROR = 'recoverableError',
  UNRECOVERABLE_ERROR = 'unrecoverableError',
}

/** Ethers `TransactionReceipt` status codes */
enum TransactionStatus {
  FAILED = 0,
  SUCCEEDED = 1,
}

const GAS_SPEED = GasSpeed.FAST;
const INITIAL_GAS_INFO: AirdropGasInfo = {
  gasFeeDisplay: undefined,
  gasLimit: undefined,
  lastUpdated: 0,
  sufficientFundsForGas: false,
};

export function useClaimAirdrop(claimable: RainbowClaimable) {
  const accountAddress = useAccountAddress();
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
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
        // Ensure onSuccess always runs on mount
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
      claimableId: claimable.uniqueId,
      chainId: claimable.chainId,
      symbol: claimable.asset.symbol,
    });

    const result = await executeAirdropClaim({
      accountAddress,
      claimable,
      gasLimit,
      gasSettings,
      onConfirm: receipt => {
        switch (receipt.status) {
          case TransactionStatus.SUCCEEDED:
            claimStatus.value = ClaimStatus.CONFIRMED;
            triggerHaptics('notificationSuccess');
            useAirdropsStore.getState().markClaimed({ accountAddress, uniqueId: claimable.uniqueId });
            logger.log('[useClaimAirdrop]: Claim transaction confirmed', { confirmations: receipt.confirmations });
            return;
          case TransactionStatus.FAILED:
            gasSettingsRef.current = gasSettings;
            claimStatus.value = ClaimStatus.RECOVERABLE_ERROR;
            triggerHaptics('notificationError');
            logger.warn('[useClaimAirdrop]: Claim transaction failed', { error: result.error });
            return;
        }
      },
    });

    if (result.success) {
      gasSettingsRef.current = 'disabled';
      staleBalancesStore.getState().addStaleBalance({
        address: accountAddress,
        chainId: claimable.chainId,
        info: { address: claimable.asset.address, transactionHash: result.txHash },
      });
    } else {
      claimStatus.value = ClaimStatus.RECOVERABLE_ERROR;
      triggerHaptics('notificationError');
      logger.warn('[useClaimAirdrop]: Claim transaction failed', { error: result.error });
    }
  } catch (error) {
    gasSettingsRef.current = gasSettings;
    claimStatus.value = ClaimStatus.RECOVERABLE_ERROR;
    triggerHaptics('notificationError');
    logger.error(new RainbowError('[useClaimAirdrop]: Unhandled error during claim'), { error });
  }
}
