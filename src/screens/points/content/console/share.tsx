import React, { useState } from 'react';
import { AnimatePresence } from '@/components/animations/AnimatePresence';
import { Paragraph } from '../../components/Paragraph';
import { Line } from '../../components/Line';
import { AnimatedText } from '../../components/AnimatedText';
import { RainbowPointsFlowSteps, textColors } from '../../constants';
import * as i18n from '@/languages';
import { useAccountProfile, useDimensions } from '@/hooks';
import { abbreviateEnsForDisplay, address as formatAddress } from '@/utils/abbreviations';
import { usePointsProfileContext } from '../../contexts/PointsProfileContext';
import { NeonButton } from '../../components/NeonButton';
import { LineBreak } from '../../components/LineBreak';
import { Bleed, Box, Inline, Stack } from '@/design-system';
import { Linking } from 'react-native';
import { metadataPOSTClient } from '@/graphql';
import { analyticsV2 } from '@/analytics';

export const Share = () => {
  const { intent, setAnimationKey, setStep } = usePointsProfileContext();
  const { accountENS, accountAddress } = useAccountProfile();
  const { width: deviceWidth } = useDimensions();

  const [showShareButtons, setShowShareButtons] = useState(false);

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
            color={textColors.gray}
            delayStart={500}
            weight="normal"
            textContent={`> ${i18n.t(i18n.l.points.console.referral_link_is_ready)}`}
          />
        </Paragraph>
        <AnimatedText
          color={textColors.account}
          delayStart={1000}
          multiline
          textContent={i18n.t(i18n.l.points.console.referral_link_bonus_text)}
        />
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
          textContent={i18n.t(i18n.l.points.console.referral_link_bonus_text_extended)}
        />
      </Stack>
      <AnimatePresence condition={showShareButtons && !!intent?.length} duration={300}>
        <Bleed horizontal={{ custom: 14 }}>
          <Inline wrap={false} horizontalSpace="12px">
            <NeonButton
              color="#F5F8FF8F"
              label={i18n.t(i18n.l.points.console.skip_referral)}
              onPress={() => {
                analyticsV2.track(analyticsV2.event.pointsOnboardingScreenPressedSkipShareToXButton);
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
                analyticsV2.track(analyticsV2.event.pointsOnboardingScreenPressedShareToXButton);
                const beginNextPhase = setTimeout(async () => {
                  if (intent) {
                    Linking.openURL(intent);
                    await metadataPOSTClient.redeemCodeForPoints({
                      address: accountAddress,
                      redemptionCode: 'TWITTERSHARED',
                    });
                  }
                  setAnimationKey(prevKey => prevKey + 1);
                  setStep(RainbowPointsFlowSteps.Review);
                }, 1000);
                return () => clearTimeout(beginNextPhase);
              }}
              width={deviceWidth - 76 - 115 - 4}
            />
          </Inline>
        </Bleed>
      </AnimatePresence>
    </Box>
  );
};
