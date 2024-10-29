import { AccentColorProvider, Box, Inline, Text, TextShadow } from '@/design-system';
import { deviceUtils } from '@/utils';
import React, { useMemo } from 'react';
import * as i18n from '@/languages';
import { ButtonPressAnimation, ShimmerAnimation } from '@/components/animations';
import { ClaimStatus } from '../types';

const BUTTON_WIDTH = deviceUtils.dimensions.width - 52;

export function ClaimButton({
  claim,
  claimStatus,
  claimType,
  claimValueDisplay,
  isSufficientGas,
  isTransactionReady,
}: {
  claim: () => void;
  claimStatus: ClaimStatus;
  claimType: 'sponsored' | 'transaction';
  claimValueDisplay: string;
  isSufficientGas?: boolean;
  isTransactionReady?: boolean;
}) {
  const isDisabled =
    claimStatus === 'claiming' ||
    ((claimStatus === 'idle' || claimStatus === 'error') && claimType === 'transaction' && !isTransactionReady);

  const shouldShowClaimText = claimStatus === 'idle' && (claimType !== 'transaction' || isSufficientGas);

  const buttonLabel = useMemo(() => {
    switch (claimStatus) {
      case 'idle':
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
    <ButtonPressAnimation disabled={isDisabled} style={{ width: '100%', paddingHorizontal: 18 }} scaleTo={0.96} onPress={claim}>
      <AccentColorProvider color={`rgba(41, 90, 247, ${isDisabled ? 0.2 : 1})`}>
        <Box
          background="accent"
          shadow="30px accent"
          borderRadius={43}
          height={{ custom: 48 }}
          width={{ custom: BUTTON_WIDTH }}
          alignItems="center"
          justifyContent="center"
        >
          <ShimmerAnimation color="#FFFFFF" enabled={!isDisabled || claimStatus === 'claiming'} width={BUTTON_WIDTH} />
          <Inline alignVertical="center" space="6px">
            {shouldShowClaimText && (
              <TextShadow shadowOpacity={isDisabled ? 0 : 0.3}>
                <Text align="center" color="label" size="icon 20px" weight="heavy">
                  􀎽
                </Text>
              </TextShadow>
            )}
            <TextShadow shadowOpacity={isDisabled ? 0 : 0.3}>
              <Text align="center" color="label" size="20pt" weight="heavy">
                {buttonLabel}
              </Text>
            </TextShadow>
          </Inline>
        </Box>
      </AccentColorProvider>
    </ButtonPressAnimation>
  );
}
