import React, { useCallback, useMemo } from 'react';
import { Box } from '@/design-system';
import { ClaimPanel } from '../../shared/components/ClaimPanel';
import { ClaimValueDisplay } from '../../shared/components/ClaimValueDisplay';
import { ClaimCustomization } from './ClaimCustomization';
import { ClaimButton } from '../../shared/components/ClaimButton';
import { GasDetails } from './GasDetails';
import { useTransactionClaimableContext } from '../context/TransactionClaimableContext';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation';
import { useWallets } from '@/hooks';
import { watchingAlert } from '@/utils';

export function TransactionClaimableFlow() {
  const {
    claim,
    claimable,
    outputConfig: { chainId: outputChainId, token: outputToken },
    claimStatus,
    setClaimStatus,
    gasState,
    quoteState,
    requiresSwap,
  } = useTransactionClaimableContext();
  const { goBack } = useNavigation();
  const { isReadOnlyWallet } = useWallets();

  // BUTTON PROPS
  const shouldShowClaimText = !!(claimStatus === 'ready' && outputChainId && outputToken);
  const disabled = !(
    ((claimStatus === 'ready' || claimStatus === 'recoverableError') && gasState.isSufficientGas) ||
    claimStatus === 'success' ||
    claimStatus === 'pending' ||
    claimStatus === 'unrecoverableError'
  );
  const shimmer = !disabled || claimStatus === 'claiming';
  const buttonLabel = useMemo(() => {
    if (!outputChainId) {
      return i18n.t(i18n.l.claimables.panel.select_a_network);
    }

    if (!outputToken) {
      return i18n.t(i18n.l.claimables.panel.select_a_token);
    }

    switch (claimStatus) {
      case 'notReady':
        if (quoteState.status === 'success' || !requiresSwap) {
          if (gasState.status === 'error') {
            return i18n.t(i18n.l.claimables.panel.gas_error);
          } else if (gasState.status === 'success' && !gasState.isSufficientGas) {
            return i18n.t(i18n.l.claimables.panel.insufficient_funds);
          } else {
            return i18n.t(i18n.l.claimables.panel.estimating_gas_fee);
          }
        } else {
          switch (quoteState.status) {
            case 'noQuoteError':
              return i18n.t(i18n.l.claimables.panel.quote_error);
            case 'noRouteError':
              return i18n.t(i18n.l.claimables.panel.no_route_found);
            case 'fetching':
            default:
              return i18n.t(i18n.l.claimables.panel.fetching_quote);
          }
        }
      case 'ready':
        return i18n.t(i18n.l.claimables.panel.claim_amount, {
          amount: requiresSwap && quoteState.tokenAmountDisplay ? quoteState.tokenAmountDisplay : claimable.value.claimAsset.display,
        });
      case 'claiming':
        return i18n.t(i18n.l.claimables.panel.claim_in_progress);
      case 'pending':
      case 'success':
      case 'unrecoverableError':
        return i18n.t(i18n.l.button.done);
      case 'recoverableError':
      default:
        return i18n.t(i18n.l.points.points.try_again);
    }
  }, [claimStatus, claimable.value.claimAsset.display, requiresSwap, quoteState, gasState, outputChainId, outputToken]);

  const onPress = useCallback(() => {
    if (isReadOnlyWallet) {
      watchingAlert();
    } else {
      if (claimStatus === 'ready' || claimStatus === 'recoverableError') {
        setClaimStatus('claiming');
        claim();
      } else if (claimStatus === 'success' || claimStatus === 'pending' || claimStatus === 'unrecoverableError') {
        goBack();
      }
    }
  }, [claim, claimStatus, goBack, isReadOnlyWallet, setClaimStatus]);

  return (
    <ClaimPanel claimStatus={claimStatus} iconUrl={claimable.iconUrl}>
      <Box gap={20} alignItems="center">
        <ClaimValueDisplay
          label={requiresSwap ? quoteState.nativeValueDisplay : claimable.value.nativeAsset.display}
          tokenIconUrl={outputToken?.iconUrl}
          tokenSymbol={outputToken?.symbol}
          chainId={outputChainId}
        />
        <ClaimCustomization />
      </Box>
      <Box alignItems="center" width="full">
        <ClaimButton onPress={onPress} disabled={disabled} shimmer={shimmer} biometricIcon={shouldShowClaimText} label={buttonLabel} />
        <GasDetails />
      </Box>
    </ClaimPanel>
  );
}
