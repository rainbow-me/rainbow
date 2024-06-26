import React, { useState } from 'react';
import { AnimatePresence } from '@/components/animations/AnimatePresence';
import { Paragraph } from '../../components/Paragraph';
import { Line } from '../../components/Line';
import { AnimatedText } from '../../components/AnimatedText';
import { RainbowPointsFlowSteps, rainbowText, textColors } from '../../constants';
import * as i18n from '@/languages';
import { useAccountProfile } from '@/hooks';
import { abbreviateEnsForDisplay, address as formatAddress } from '@/utils/abbreviations';
import { usePointsProfileContext } from '../../contexts/PointsProfileContext';
import { NeonButton } from '../../components/NeonButton';
import { Bleed, Box, Stack } from '@/design-system';
import { LineBreak } from '../../components/LineBreak';

export const Initialize = () => {
  const [showSignInButton, setShowSignInButton] = useState(false);
  const { profile, setStep, setAnimationKey, signIn } = usePointsProfileContext();
  const { accountENS, accountAddress } = useAccountProfile();

  const accountName = (abbreviateEnsForDisplay(accountENS, 10) || formatAddress(accountAddress, 4, 5)) as string;

  return (
    <Box height="full" justifyContent="space-between">
      <Stack separator={<LineBreak lines={3} />}>
        <Paragraph>
          <Line>
            <AnimatedText
              delayStart={500}
              color={textColors.gray}
              textContent={`${i18n.t(i18n.l.points.console.account)}:`}
              weight="normal"
            />
            <AnimatedText color={textColors.account} enableHapticTyping delayStart={300} textContent={accountName} />
          </Line>
          <AnimatedText
            color={textColors.gray}
            delayStart={500}
            textContent={`> ${i18n.t(i18n.l.points.console.auth_required)}`}
            weight="normal"
          />
          <AnimatedText
            color={textColors.gray}
            onComplete={() => setShowSignInButton(true)}
            textContent={`> ${i18n.t(i18n.l.points.console.sign_in_with_wallet)}`}
            weight="normal"
          />
          <AnimatedText
            color={textColors.green}
            enableHapticTyping
            startWhenTrue={!!profile}
            textContent={`> ${i18n.t(i18n.l.points.console.access_granted)}`}
          />
        </Paragraph>
        <Paragraph leftIndent={2}>
          <AnimatedText delayStart={1000} rainbowText textContent={rainbowText.row1} typingSpeed={10} />
          <AnimatedText rainbowText textContent={rainbowText.row2} typingSpeed={10} />
          <AnimatedText rainbowText textContent={rainbowText.row3} typingSpeed={10} />
          <AnimatedText rainbowText textContent={rainbowText.row4} typingSpeed={10} />
          <AnimatedText rainbowText textContent={rainbowText.row5} typingSpeed={10} />
          <AnimatedText rainbowText textContent={rainbowText.row6} typingSpeed={10} />
          <AnimatedText rainbowText textContent={rainbowText.row7} typingSpeed={10} />
          <AnimatedText rainbowText textContent={rainbowText.row8} typingSpeed={10} />
          <Line leftIndent={ios ? 7 : 6}>
            <AnimatedText
              color={textColors.white}
              enableHapticTyping
              onComplete={() => {
                const beginNextPhase = setTimeout(() => {
                  setAnimationKey(prevKey => prevKey + 1);
                  setStep(RainbowPointsFlowSteps.CalculatePoints);
                }, 2500);
                return () => clearTimeout(beginNextPhase);
              }}
              textContent={rainbowText.row9}
              typingSpeed={100}
            />
          </Line>
        </Paragraph>
      </Stack>
      <AnimatePresence condition={showSignInButton && !profile} duration={300}>
        <Bleed horizontal={{ custom: 14 }}>
          <NeonButton label={`􀎽 ${i18n.t(i18n.l.points.console.sign_in)}`} onPress={signIn} />
        </Bleed>
      </AnimatePresence>
    </Box>
  );
};
