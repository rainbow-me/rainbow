import React, { useCallback, useMemo } from 'react';
import { ClaimPanel } from '../../shared/components/ClaimPanel';
import { ClaimValueDisplay } from '../../shared/components/ClaimValueDisplay';
import { ClaimButton } from '../../shared/components/ClaimButton';
import { useSponsoredClaimableContext } from '../context/SponsoredClaimableContext';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation';
import { useWallets } from '@/hooks';
import { watchingAlert } from '@/utils';

export function SponsoredClaimableFlow() {
  const { goBack } = useNavigation();
  const { claim, claimable, claimStatus, setClaimStatus } = useSponsoredClaimableContext();
  const { isReadOnlyWallet } = useWallets();

  const shouldShowClaimText = claimStatus === 'ready';
  const buttonLabel = useMemo(() => {
    switch (claimStatus) {
      case 'ready':
        if (shouldShowClaimText) {
          return i18n.t(i18n.l.claimables.panel.claim_amount, { amount: claimable.value.claimAsset.display });
        } else {
          return i18n.t(i18n.l.claimables.panel.insufficient_funds);
        }
      case 'claiming':
        return i18n.t(i18n.l.claimables.panel.claim_in_progress);
      case 'pending':
      case 'success':
        return i18n.t(i18n.l.button.done);
      case 'recoverableError':
      default:
        return i18n.t(i18n.l.points.points.try_again);
    }
  }, [claimStatus, claimable.value.claimAsset.display, shouldShowClaimText]);

  const onPress = useCallback(() => {
    if (isReadOnlyWallet) {
      watchingAlert();
    } else {
      if (claimStatus === 'ready') {
        setClaimStatus('claiming');
        claim();
      } else if (claimStatus === 'success' || claimStatus === 'pending') {
        goBack();
      }
    }
  }, [claim, claimStatus, goBack, isReadOnlyWallet, setClaimStatus]);

  return (
    <ClaimPanel claimStatus={claimStatus} iconUrl={claimable.iconUrl}>
      <ClaimValueDisplay
        label={claimable.value.nativeAsset.display}
        tokenIconUrl={claimable.asset.icon_url}
        tokenSymbol={claimable.asset.symbol}
        chainId={claimable.chainId}
      />
      <ClaimButton
        onPress={onPress}
        disabled={claimStatus === 'claiming'}
        shimmer
        biometricIcon={shouldShowClaimText}
        label={buttonLabel}
      />
    </ClaimPanel>
  );
}
