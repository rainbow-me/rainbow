import { analytics } from '@/analytics';
import { AnimatePresence } from '@/components/animations/AnimatePresence';
import { Bleed, Box, Inline, Stack } from '@/design-system';
import * as i18n from '@/languages';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { abbreviateEnsForDisplay, address as formatAddress } from '@/utils/abbreviations';
import { openInBrowser } from '@/utils/openInBrowser';
import React, { useState } from 'react';
import { AnimatedText } from '../../components/AnimatedText';
import { Line } from '../../components/Line';
import { LineBreak } from '../../components/LineBreak';
import { NeonButton } from '../../components/NeonButton';
import { Paragraph } from '../../components/Paragraph';
import { RainbowPointsFlowSteps, textColors } from '../../constants';
import { usePointsProfileContext } from '../../contexts/PointsProfileContext';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

export const Share = () => {
  const { intent, setAnimationKey, setStep } = usePointsProfileContext();
  const { accountENS, accountAddress } = useAccountProfileInfo();

  const [showShareButtons, setShowShareButtons] = useState(false);

  const accountName = abbreviateEnsForDisplay(accountENS, 10) || (accountAddress ? formatAddress(accountAddress, 4, 5) : '');

  return (
    <Box height="full" justifyContent="space-between">
      <Stack separator={<LineBreak lines={3} />}>
        <Paragraph>
          <Line>
            <AnimatedText color={textColors.gray} skipAnimation textContent={`${i18n.t(i18n.l.points.console.account)}:`} weight="normal" />
            <AnimatedText color={textColors.account} skipAnimation textContent={accountName} />
          </Line>
          <AnimatedText
            color={textColors.gray}
            delayStart={500}
            weight="normal"
            textContent={`> ${i18n.t(i18n.l.points.console.referral_link_is_ready)}`}
          />
        </Paragraph>
        <AnimatedText
          color={textColors.account}
          delayStart={1000}
          onComplete={() => {
            const complete = setTimeout(() => {
              setShowShareButtons(true);
            }, 500);
            return () => clearTimeout(complete);
          }}
          multiline
          textContent={i18n.t(i18n.l.points.console.referral_link_bonus_text)}
        />
      </Stack>
      <AnimatePresence condition={showShareButtons && !!intent?.length} duration={300}>
        <Bleed horizontal={{ custom: 14 }}>
          <Inline wrap={false} horizontalSpace="12px">
            <NeonButton
              color="#F5F8FF8F"
              label={i18n.t(i18n.l.points.console.skip_referral)}
              onPress={() => {
                analytics.track(analytics.event.pointsOnboardingScreenPressedSkipShareToXButton);
                const beginNextPhase = setTimeout(() => {
                  setAnimationKey(prevKey => prevKey + 1);
                  setStep(RainbowPointsFlowSteps.Review);
                }, 1000);
                return () => clearTimeout(beginNextPhase);
              }}
              width={115}
            />
            <NeonButton
              color="#FEC101"
              label={i18n.t(i18n.l.points.console.share_to_x)}
              onPress={() => {
                analytics.track(analytics.event.pointsOnboardingScreenPressedShareToXButton);
                const beginNextPhase = setTimeout(async () => {
                  if (intent) {
                    openInBrowser(intent, false);
                  }
                  setAnimationKey(prevKey => prevKey + 1);
                  setStep(RainbowPointsFlowSteps.Review);
                }, 1000);
                return () => clearTimeout(beginNextPhase);
              }}
              width={DEVICE_WIDTH - 76 - 115 - 4}
            />
          </Inline>
        </Bleed>
      </AnimatePresence>
    </Box>
  );
};
