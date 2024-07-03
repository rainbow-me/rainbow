import React, { useState } from 'react';
import { AnimatePresence } from '@/components/animations/AnimatePresence';
import { Paragraph } from '../../components/Paragraph';
import { Line } from '../../components/Line';
import { AnimatedText } from '../../components/AnimatedText';
import { textColors } from '../../constants';
import * as i18n from '@/languages';
import { useAccountProfile } from '@/hooks';
import { abbreviateEnsForDisplay, address as formatAddress } from '@/utils/abbreviations';
import { NeonButton } from '../../components/NeonButton';
import { LineBreak } from '../../components/LineBreak';
import { Bleed, Box, Stack } from '@/design-system';
import { useNavigation } from '@/navigation';
import { analyticsV2 } from '@/analytics';

export const Review = () => {
  const { accountENS, accountAddress } = useAccountProfile();
  const { goBack } = useNavigation();

  const [showDoneButton, setShowDoneButton] = useState(false);

  const accountName = (abbreviateEnsForDisplay(accountENS, 10) || formatAddress(accountAddress, 4, 5)) as string;

  return (
    <Box height="full" justifyContent="space-between">
      <Stack separator={<LineBreak lines={3} />}>
        <Paragraph>
          <Line>
            <AnimatedText color={textColors.gray} skipAnimation textContent={`${i18n.t(i18n.l.points.console.account)}:`} weight="normal" />
            <AnimatedText color={textColors.account} skipAnimation textContent={accountName} />
          </Line>
          <AnimatedText
            color={textColors.green}
            delayStart={500}
            textContent={`> ${i18n.t(i18n.l.points.console.registration_complete)}`}
          />
        </Paragraph>
        <Stack separator={<LineBreak lines={2} />}>
          <Paragraph>
            <AnimatedText
              delayStart={500}
              color={textColors.gray}
              textContent={i18n.t(i18n.l.points.console.share_bonus_paragraph_one)}
              multiline
              weight="normal"
            />
            <AnimatedText
              color={textColors.gray}
              delayStart={500}
              textContent={i18n.t(i18n.l.points.console.share_bonus_paragraph_two)}
              multiline
              weight="normal"
            />
            <AnimatedText
              color={textColors.gray}
              onComplete={() => {
                const complete = setTimeout(() => {
                  setShowDoneButton(true);
                }, 500);
                return () => clearTimeout(complete);
              }}
              textContent={i18n.t(i18n.l.points.console.share_bonus_paragraph_three)}
              multiline
              weight="normal"
            />
          </Paragraph>
        </Stack>
      </Stack>
      <AnimatePresence condition={showDoneButton} duration={300}>
        <Bleed horizontal={{ custom: 14 }}>
          <NeonButton
            color="#FEC101"
            label={i18n.t(i18n.l.points.console.complete_onboarding)}
            onPress={() => {
              analyticsV2.track(analyticsV2.event.pointsOnboardingScreenPressedDoneButton);
              goBack();
            }}
          />
        </Bleed>
      </AnimatePresence>
    </Box>
  );
};
