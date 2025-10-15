import i18n from '@/languages';
import { useNavigation } from '@/navigation';
import { watchingAlert } from '@/utils';
import React, { useCallback, useMemo } from 'react';
import { useIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import { ClaimButton } from '../../shared/components/ClaimButton';
import { ClaimPanel } from '../../shared/components/ClaimPanel';
import { ClaimValueDisplay } from '../../shared/components/ClaimValueDisplay';
import { useSponsoredClaimableContext } from '../context/SponsoredClaimableContext';

export function SponsoredClaimableFlow() {
  const { goBack } = useNavigation();
  const { claim, claimable, claimStatus, setClaimStatus } = useSponsoredClaimableContext();
  const isReadOnlyWallet = useIsReadOnlyWallet();

  const [asset] = claimable.assets;

  const shouldShowClaimText = claimStatus === 'ready';
  const buttonLabel = useMemo(() => {
    switch (claimStatus) {
      case 'ready':
        if (shouldShowClaimText) {
          return i18n.claimables.panel.claim_amount({ amount: asset.amount.display });
        } else {
          return i18n.claimables.panel.insufficient_funds();
        }
      case 'claiming':
        return i18n.claimables.panel.claim_in_progress();
      case 'pending':
      case 'success':
        return i18n.button.done();
      case 'recoverableError':
      default:
        return i18n.points.points.try_again();
    }
  }, [claimStatus, shouldShowClaimText, asset.amount.display]);

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
        label={claimable.totalCurrencyValue.display}
        tokenIconUrl={asset.asset.icon_url}
        tokenSymbol={asset.asset.symbol}
        chainId={claimable.chainId}
      />
      <ClaimButton
        onPress={onPress}
        enableHoldToPress={claimStatus !== 'success' && claimStatus !== 'pending'}
        isLoading={claimStatus === 'claiming'}
        disabled={claimStatus === 'claiming'}
        shimmer
        biometricIcon={shouldShowClaimText}
        label={buttonLabel}
      />
    </ClaimPanel>
  );
}
