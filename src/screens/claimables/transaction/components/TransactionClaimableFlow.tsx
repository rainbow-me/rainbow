import React, { useCallback, useMemo } from 'react';
import { Box } from '@/design-system';
import { ClaimPanel } from '../../shared/components/ClaimPanel';
import { ClaimValueDisplay } from '../../shared/components/ClaimValueDisplay';
import { ClaimCustomization } from './ClaimCustomization';
import { ClaimButton } from '../../shared/components/ClaimButton';
import { GasDetails } from './GasDetails';
import { useTransactionClaimableContext } from '../context/TransactionClaimableContext';
import * as i18n from '@/languages';
import { abbreviateNumber } from '@/helpers/utilities';
import { useNavigation } from '@/navigation';

export function TransactionClaimableFlow() {
  const {
    claim,
    claimable,
    outputConfig: { chainId: outputChainId, token: outputToken },
    claimStatus,
    setClaimStatus,
    txState,
    quoteState,
    requiresSwap,
  } = useTransactionClaimableContext();
  const { goBack } = useNavigation();

  // BUTTON PROPS
  const shouldShowClaimText = !!(claimStatus === 'ready' && outputChainId && outputToken);
  const disabled = !(
    ((claimStatus === 'ready' || claimStatus === 'recoverableError') && txState.isSufficientGas) ||
    claimStatus === 'success' ||
    claimStatus === 'pending' ||
    claimStatus === 'unrecoverableError'
  );
  const shimmer = !disabled || claimStatus === 'claiming';
  const buttonLabel = useMemo(() => {
    if (!outputChainId) {
      return 'Select a Network';
    }

    if (!outputToken) {
      return 'Select a Token';
    }

    switch (claimStatus) {
      case 'notReady':
        if (quoteState.status === 'success' || !requiresSwap) {
          switch (txState.status) {
            case 'error':
              return 'Gas Error';
            case 'success':
              if (!txState.isSufficientGas) {
                return i18n.t(i18n.l.claimables.panel.insufficient_funds);
              }
            case 'fetching':
            default:
              return i18n.t(i18n.l.claimables.panel.estimating_gas_fee);
          }
        }

        switch (quoteState.status) {
          case 'noQuoteError':
            return 'Quote Error';
          case 'noRouteError':
            return 'No Route Found';
          case 'fetching':
          default:
            return 'Fetching Quote...';
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
  }, [claimStatus, claimable.value.claimAsset.display, requiresSwap, quoteState, txState, outputChainId, outputToken]);

  const onPress = useCallback(() => {
    if (claimStatus === 'ready' || claimStatus === 'recoverableError') {
      setClaimStatus('claiming');
      claim();
    } else if (claimStatus === 'success' || claimStatus === 'pending' || claimStatus === 'unrecoverableError') {
      goBack();
    }
  }, [claim, claimStatus, goBack, setClaimStatus]);

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
