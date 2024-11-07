import { AccentColorProvider, Box, Inline, Text, TextShadow } from '@/design-system';
import { deviceUtils } from '@/utils';
import React from 'react';
import { ButtonPressAnimation, ShimmerAnimation } from '@/components/animations';

const BUTTON_WIDTH = deviceUtils.dimensions.width - 52;

export function ClaimButton({
  onPress,
  disabled,
  shimmer,
  biometricIcon,
  label,
}: {
  onPress: () => void;
  disabled: boolean;
  shimmer: boolean;
  biometricIcon: boolean;
  label: string;
}) {
  return (
    <ButtonPressAnimation disabled={disabled} style={{ width: '100%', paddingHorizontal: 18 }} scaleTo={0.96} onPress={onPress}>
      <AccentColorProvider color={`rgba(41, 90, 247, ${disabled ? 0.2 : 1})`}>
        <Box
          background="accent"
          shadow="30px accent"
          borderRadius={43}
          height={{ custom: 48 }}
          width={{ custom: BUTTON_WIDTH }}
          alignItems="center"
          justifyContent="center"
        >
          <ShimmerAnimation color="#FFFFFF" enabled={shimmer} width={BUTTON_WIDTH} />
          <Inline alignVertical="center" space="6px">
            {biometricIcon && (
              <TextShadow shadowOpacity={disabled ? 0 : 0.3}>
                <Text align="center" color="label" size="icon 20px" weight="heavy">
                  􀎽
                </Text>
              </TextShadow>
            )}
            <TextShadow shadowOpacity={disabled ? 0 : 0.3}>
              <Text align="center" color="label" size="20pt" weight="heavy">
                {label}
              </Text>
            </TextShadow>
          </Inline>
        </Box>
      </AccentColorProvider>
    </ButtonPressAnimation>
  );
}

// export function ClaimButton2({
//   claim,
//   claimValueDisplay,
//   isSufficientGas,
//   isTransactionReady,
// }: {
//   claim: () => void;
//   claimValueDisplay: string;
//   isSufficientGas?: boolean;
//   isTransactionReady?: boolean;
// }) {
//   const {
//     claimable: { type: claimType },
//     claimStatus,
//   } = useClaimContext();

//   const isDisabled =
//     claimStatus === 'fetchingQuote' ||
//     claimStatus === 'claiming' ||
//     claimStatus === 'noQuote' ||
//     claimStatus === 'noRoute' ||
//     ((claimStatus === 'ready' || claimStatus === 'error') && claimType === 'transaction' && !isTransactionReady);

//   const shouldShowClaimText = claimStatus === 'ready' && (claimType !== 'transaction' || isSufficientGas);

//   const buttonLabel = useMemo(() => {
//     switch (claimStatus) {
//       case 'fetchingQuote':
//         return 'Fetching Quote';
//       case 'ready':
//         if (shouldShowClaimText) {
//           return i18n.t(i18n.l.claimables.panel.claim_amount, { amount: claimValueDisplay });
//         } else {
//           return i18n.t(i18n.l.claimables.panel.insufficient_funds);
//         }
//       case 'noQuote':
//         return 'Quote Error';
//       case 'noRoute':
//         return 'No Route Found';
//       case 'claiming':
//         return i18n.t(i18n.l.claimables.panel.claim_in_progress);
//       case 'pending':
//       case 'success':
//         return i18n.t(i18n.l.button.done);
//       case 'error':
//       default:
//         return i18n.t(i18n.l.points.points.try_again);
//     }
//   }, [claimStatus, claimValueDisplay, shouldShowClaimText]);

//   return (
//     <ButtonPressAnimation disabled={isDisabled} style={{ width: '100%', paddingHorizontal: 18 }} scaleTo={0.96} onPress={claim}>
//       <AccentColorProvider color={`rgba(41, 90, 247, ${isDisabled ? 0.2 : 1})`}>
//         <Box
//           background="accent"
//           shadow="30px accent"
//           borderRadius={43}
//           height={{ custom: 48 }}
//           width={{ custom: BUTTON_WIDTH }}
//           alignItems="center"
//           justifyContent="center"
//         >
//           <ShimmerAnimation color="#FFFFFF" enabled={!isDisabled || claimStatus === 'claiming'} width={BUTTON_WIDTH} />
//           <Inline alignVertical="center" space="6px">
//             {shouldShowClaimText && (
//               <TextShadow shadowOpacity={isDisabled ? 0 : 0.3}>
//                 <Text align="center" color="label" size="icon 20px" weight="heavy">
//                   􀎽
//                 </Text>
//               </TextShadow>
//             )}
//             <TextShadow shadowOpacity={isDisabled ? 0 : 0.3}>
//               <Text align="center" color="label" size="20pt" weight="heavy">
//                 {buttonLabel}
//               </Text>
//             </TextShadow>
//           </Inline>
//         </Box>
//       </AccentColorProvider>
//     </ButtonPressAnimation>
//   );
// }
