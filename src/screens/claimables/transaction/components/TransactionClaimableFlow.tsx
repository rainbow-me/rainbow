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
import { ClaimableType } from '@/resources/addys/claimables/types';
import { ClaimValueMultipleDisplay } from '../../shared/components/ClaimValueMultipleDisplay';

export function TransactionClaimableFlow() {
  const {
    claim,
    claimable,
    outputConfig: { chainId: outputChainId, token: outputToken },
    claimStatus,
    setClaimStatus,
    gasState,
    quoteState,
    swapEnabled,
    requiresSwap,
  } = useTransactionClaimableContext();
  const { goBack } = useNavigation();
  const { isReadOnlyWallet } = useWallets();

  const type = claimable.type.replaceAll('_', '-');

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
      case 'ready': {
        if (claimable.assets.length > 1) {
          return i18n.t(i18n.l.claimables.panel.hold_to_claim);
        }
        const [asset] = claimable.assets;
        return i18n.t(i18n.l.claimables.panel.claim_amount, {
          amount: requiresSwap && quoteState.tokenAmountDisplay ? quoteState.tokenAmountDisplay : asset.amount.display,
        });
      }
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
  }, [claimStatus, claimable.assets, requiresSwap, quoteState, gasState, outputChainId, outputToken]);

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

  const title = useMemo(() => {
    switch (type) {
      case ClaimableType.RainbowSuperTokenCreatorFees:
        return i18n.t(i18n.l.claimables.panel.creator_lp_fees);
      default:
        return i18n.t(i18n.l.claimables.panel.claim);
    }
  }, [type]);

  const subtitle = useMemo(() => {
    switch (type) {
      case ClaimableType.RainbowSuperTokenCreatorFees:
        return i18n.t(i18n.l.claimables.panel.rainbow_token_launcher);
      case ClaimableType.merklClaimable: {
        const assetSymbols = claimable.assets
          .slice(0, 2)
          .map(asset => asset.asset.symbol)
          .join(' / ');
        return i18n.t(i18n.l.claimables.panel.merkl_claimable_description, { assetSymbols });
      }
      default:
        return undefined;
    }
  }, [type, claimable.assets]);

  const ClaimContent = useMemo(() => {
    if (claimable.assets.length === 1) {
      return (
        <ClaimValueDisplay
          label={requiresSwap ? quoteState.nativeValueDisplay : claimable.totalCurrencyValue.display}
          tokenIconUrl={outputToken?.iconUrl}
          tokenSymbol={outputToken?.symbol}
          chainId={outputChainId}
        />
      );
    }
    return <ClaimValueMultipleDisplay assets={claimable.assets} totalCurrencyValue={claimable.totalCurrencyValue.display} />;
  }, [
    claimable.assets,
    claimable.totalCurrencyValue,
    requiresSwap,
    quoteState.nativeValueDisplay,
    outputChainId,
    outputToken?.iconUrl,
    outputToken?.symbol,
  ]);

  return (
    <ClaimPanel title={title} subtitle={subtitle} claimStatus={claimStatus} iconUrl={claimable.iconUrl}>
      <Box gap={20} alignItems="center">
        {ClaimContent}
        {swapEnabled && <ClaimCustomization />}
      </Box>

      <Box alignItems="center" width="full">
        <ClaimButton
          enableHoldToPress={claimStatus !== 'success' && claimStatus !== 'pending' && claimStatus !== 'unrecoverableError'}
          isLoading={claimStatus === 'claiming'}
          onPress={onPress}
          disabled={disabled}
          shimmer={shimmer}
          biometricIcon={shouldShowClaimText}
          label={buttonLabel}
        />
        <GasDetails />
      </Box>
    </ClaimPanel>
  );
}
