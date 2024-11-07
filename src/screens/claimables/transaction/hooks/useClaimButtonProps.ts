import { useMemo } from 'react';
import { useTransactionClaimableContext } from '../context/TransactionClaimableContext';
import * as i18n from '@/languages';
import { ClaimButtonProps } from '../../shared/components/ClaimButton';

export function useClaimButtonProps(): ClaimButtonProps {
  const { claimStatus, claim, isClaimReady, isSufficientGas } = useTransactionClaimableContext();

  const disabled =
    claimStatus === 'fetchingQuote' ||
    claimStatus === 'claiming' ||
    claimStatus === 'noQuote' ||
    claimStatus === 'noRoute' ||
    ((claimStatus === 'ready' || claimStatus === 'error') && !isClaimReady);

  const shimmer = !disabled || claimStatus === 'claiming';

  const shouldShowClaimText = claimStatus === 'ready' && isSufficientGas;

  const claimValueDisplay = 'FIXME';

  const label = useMemo(() => {
    switch (claimStatus) {
      case 'fetchingQuote':
        return 'Fetching Quote';
      case 'ready':
        if (shouldShowClaimText) {
          return i18n.t(i18n.l.claimables.panel.claim_amount, { amount: claimValueDisplay });
        } else {
          return i18n.t(i18n.l.claimables.panel.insufficient_funds);
        }
      case 'noQuote':
        return 'Quote Error';
      case 'noRoute':
        return 'No Route Found';
      case 'claiming':
        return i18n.t(i18n.l.claimables.panel.claim_in_progress);
      case 'pending':
      case 'success':
        return i18n.t(i18n.l.button.done);
      case 'error':
      default:
        return i18n.t(i18n.l.points.points.try_again);
    }
  }, [claimStatus, claimValueDisplay, shouldShowClaimText]);

  return {
    onPress: claim,
    disabled,
    shimmer,
    biometricIcon: shouldShowClaimText,
    label,
  };
}
