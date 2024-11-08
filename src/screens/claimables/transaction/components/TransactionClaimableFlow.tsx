import React, { useMemo } from 'react';
import { Box } from '@/design-system';
import { ClaimPanel } from '../../shared/components/ClaimPanel';
import { ClaimValueDisplay } from '../../shared/components/ClaimValueDisplay';
import { ClaimCustomization } from './ClaimCustomization';
import { ClaimButton } from '../../shared/components/ClaimButton';
import { GasDetails } from './GasDetails';
import { useTransactionClaimableContext } from '../context/TransactionClaimableContext';
import * as i18n from '@/languages';

export function TransactionClaimableFlow() {
  const {
    claim,
    claimable,
    outputConfig: { chainId: outputChainId, token: outputToken },
    claimStatus,
    isSufficientGas,
    claimNativeValueDisplay,
    gasFeeDisplay,
  } = useTransactionClaimableContext();

  // BUTTON PROPS
  const disabled =
    claimStatus === 'fetchingQuote' ||
    claimStatus === 'claiming' ||
    claimStatus === 'noQuote' ||
    claimStatus === 'noRoute' ||
    ((claimStatus === 'ready' || claimStatus === 'error') && !isSufficientGas);
  const shimmer = !disabled || claimStatus === 'claiming';
  const shouldShowClaimText = claimStatus === 'ready' && isSufficientGas;
  const claimValueDisplay = 'FIXME';
  const buttonLabel = useMemo(() => {
    if (!outputChainId) {
      return 'Select a Network';
    }

    if (!outputToken) {
      return 'Select a Token';
    }

    switch (claimStatus) {
      case 'estimatingGas':
        return i18n.t(i18n.l.claimables.panel.estimating_gas_fee);
      case 'fetchingQuote':
        return 'Fetching Quote...';
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
  }, [claimStatus, outputChainId, outputToken, shouldShowClaimText]);

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
        <ClaimButton onPress={claim} disabled={disabled} shimmer={shimmer} biometricIcon={shouldShowClaimText} label={buttonLabel} />
        <GasDetails />
      </Box>
    </ClaimPanel>
  );
}
