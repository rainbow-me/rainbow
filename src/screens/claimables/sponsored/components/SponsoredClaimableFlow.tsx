import React, { useMemo } from 'react';
import { useAccountSettings } from '@/hooks';
import { ClaimPanel } from '../../shared/components/ClaimPanel';
import { ClaimValueDisplay } from '../../shared/components/ClaimValueDisplay';
import { ClaimButton } from '../../shared/components/ClaimButton';
import { useSponsoredClaimableContext } from '../context/SponsoredClaimableContext';
import * as i18n from '@/languages';

export function SponsoredClaimableFlow() {
  const { nativeCurrency } = useAccountSettings();
  const { claim, claimable, claimStatus } = useSponsoredClaimableContext();

  const claimNativeValueDisplay = 'FIXME';

  const claimValueDisplay = 'FIXME';
  const shouldShowClaimText = claimStatus === 'ready';
  const buttonLabel = useMemo(() => {
    switch (claimStatus) {
      case 'ready':
        if (shouldShowClaimText) {
          return i18n.t(i18n.l.claimables.panel.claim_amount, { amount: claimValueDisplay });
        } else {
          return i18n.t(i18n.l.claimables.panel.insufficient_funds);
        }
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

  return (
    <ClaimPanel claimStatus={claimStatus} iconUrl={claimable.iconUrl}>
      <ClaimValueDisplay
        label={claimNativeValueDisplay}
        tokenIconUrl={claimable.asset.icon_url}
        tokenSymbol={claimable.asset.symbol}
        chainId={claimable.chainId}
      />
      <ClaimButton onPress={claim} disabled={claimStatus === 'claiming'} shimmer biometricIcon={shouldShowClaimText} label={buttonLabel} />
    </ClaimPanel>
  );
}
