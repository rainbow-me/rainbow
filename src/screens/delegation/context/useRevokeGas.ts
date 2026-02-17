import { useEffect, useMemo } from 'react';
import useGas from '@/hooks/useGas';
import { GasFee, LegacyGasFee } from '@/entities/gas';
import { convertAmountToNativeDisplayWorklet } from '@/helpers/utilities';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { ChainId } from '@/state/backendNetworks/types';
import * as i18n from '@/languages';
import { RevokeStatus } from '../types';

/**
 * Gas polling lifecycle, fee display derivation, and notReady → ready transition.
 */
export function useRevokeGas(
  chainId: ChainId | undefined,
  revokeStatus: RevokeStatus,
  setRevokeStatus: (s: RevokeStatus) => void
): { gasFeeDisplay: string | null } {
  const { startPollingGasFees, stopPollingGasFees, selectedGasFee } = useGas();
  const nativeCurrency = userAssetsStoreManager(state => state.currency);

  useEffect(() => {
    if (chainId) {
      startPollingGasFees(chainId);
    }
    return () => {
      stopPollingGasFees();
    };
  }, [chainId, startPollingGasFees, stopPollingGasFees]);

  // Gas fee display with $0.01 floor
  const gasFeeDisplay = useMemo(() => {
    if (!chainId) return null;
    const gasFee = selectedGasFee?.gasFee;
    if (!gasFee) return i18n.t(i18n.l.swap.loading);
    const isLegacy = !!(gasFee as LegacyGasFee)?.estimatedFee;
    const feeData = isLegacy ? (gasFee as LegacyGasFee)?.estimatedFee : (gasFee as GasFee)?.maxFee;
    const amount = Number(feeData?.native?.value?.amount);
    if (!Number.isFinite(amount)) return i18n.t(i18n.l.swap.loading);
    return convertAmountToNativeDisplayWorklet(amount, nativeCurrency, true);
  }, [chainId, selectedGasFee, nativeCurrency]);

  // Transition notReady → ready when gas resolves
  useEffect(() => {
    if (revokeStatus !== 'notReady') return;
    if (!selectedGasFee?.gasFee) return;

    const gasFee = selectedGasFee.gasFee;
    const isLegacy = !!(gasFee as LegacyGasFee)?.estimatedFee;
    const feeData = isLegacy ? (gasFee as LegacyGasFee)?.estimatedFee : (gasFee as GasFee)?.maxFee;
    const amount = Number(feeData?.native?.value?.amount);

    if (Number.isFinite(amount)) {
      setRevokeStatus('ready');
    }
  }, [revokeStatus, selectedGasFee, setRevokeStatus]);

  return { gasFeeDisplay };
}
