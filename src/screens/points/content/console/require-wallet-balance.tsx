import React, { useState } from 'react';
import { AnimatePresence } from '@/components/animations/AnimatePresence';
import Paragraph from '../../components/Paragraph';
import Line from '../../components/Line';
import { AnimatedText } from '../../components/AnimatedText';
import {
  RainbowPointsFlowSteps,
  rainbowText,
  textColors,
} from '../../constants';
import * as i18n from '@/languages';
import { useAccountProfile } from '@/hooks';
import {
  abbreviateEnsForDisplay,
  address as formatAddress,
} from '@/utils/abbreviations';
import { usePointsProfileContext } from '../../contexts/PointsProfileContext';
import { NeonButton } from '../../components/NeonButton';
import { Bleed, Box, Stack } from '@/design-system';

export const RequireWalletBalance = () => {
  const [showSignInButton, setShowSignInButton] = useState(false);
  const {
    profile,
    setStep,
    setAnimationKey,
    signIn,
  } = usePointsProfileContext();
  const { accountENS, accountAddress } = useAccountProfile();

  const accountName = (abbreviateEnsForDisplay(accountENS, 10) ||
    formatAddress(accountAddress, 4, 5)) as string;
  console.log('hello');
  return (
    <Box height="full" justifyContent="space-between">
      <Stack space="44px">
        <Paragraph>
          <Line>
            <AnimatedText
              delayStart={500}
              color={textColors.gray}
              textContent={`${i18n.t(i18n.l.points.console.account)}:`}
              weight="normal"
            />
            <AnimatedText
              color={textColors.account}
              enableHapticTyping
              delayStart={300}
              textContent={accountName}
            />
          </Line>
          <AnimatedText
            color={textColors.red}
            delayStart={500}
            textContent={`> ${i18n.t(
              i18n.l.points.console.wallet_balance_required
            )}`}
            weight="normal"
          />
        </Paragraph>
        {/* <AnimatedText
          color={textColors.gray}
          delayStart={1000}
          // onComplete={() => {
          //   const complete = setTimeout(() => {
          //     setIsCalculationComplete(true);
          //     setShouldShowContinueButton(true);
          //   }, 500);
          //   return () => clearTimeout(complete);
          // }}
          weight="normal"
          multiline
          textContent={i18n.t(
            i18n.l.points.console.require_balance_paragraph_one
          )}
        /> */}
      </Stack>
      {/* <AnimatePresence condition={showSignInButton && !profile} duration={300}>
        <Bleed horizontal={{ custom: 14 }}>
          <NeonButton
            label={`􀎽 ${i18n.t(i18n.l.points.console.sign_in)}`}
            onPress={signIn}
          />
        </Bleed>
      </AnimatePresence> */}
    </Box>
  );
};
