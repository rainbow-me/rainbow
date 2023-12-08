import React, { useState } from 'react';
import { AnimatePresence } from '@/components/animations/AnimatePresence';
import Paragraph from '../../components/Paragraph';
import Line from '../../components/Line';
import { AnimatedText } from '../../components/AnimatedText';
import { RainbowPointsFlowSteps, textColors } from '../../constants';
import * as i18n from '@/languages';
import { useAccountProfile, useDimensions } from '@/hooks';
import {
  abbreviateEnsForDisplay,
  address as formatAddress,
} from '@/utils/abbreviations';
import { usePointsProfileContext } from '../../contexts/PointsProfileContext';
import { NeonButton } from '../../components/NeonButton';
import LineBreak from '../../components/LineBreak';
import { Bleed, Box, Inline, Stack } from '@/design-system';
import { Linking } from 'react-native';
import { metadataPOSTClient } from '@/graphql';

export const Share = () => {
  const {
    intent,
    setAnimationKey,
    setShareBonusPoints,
    setStep,
  } = usePointsProfileContext();
  const { accountENS, accountAddress } = useAccountProfile();
  const { width: deviceWidth } = useDimensions();

  const [showShareButtons, setShowShareButtons] = useState(false);

  const accountName = (abbreviateEnsForDisplay(accountENS, 10) ||
    formatAddress(accountAddress, 4, 5)) as string;

  return (
    <Box height="full" justifyContent="space-between">
      <Stack separator={<LineBreak lines={2} />}>
        <Paragraph>
          <Line>
            <AnimatedText
              delayStart={500}
              color={textColors.gray}
              skipAnimation
              textContent={`${i18n.t(i18n.l.points.console.account)}:`}
              weight="normal"
            />
            <AnimatedText
              color={textColors.account}
              skipAnimation
              textContent={accountName}
            />
          </Line>
          <AnimatedText
            color={textColors.gray}
            textContent={`> ${i18n.t(
              i18n.l.points.console.referral_link_is_ready
            )}`}
          />
        </Paragraph>
        <AnimatedText
          color={textColors.account}
          delayStart={1000}
          weight="normal"
          multiline
          textContent={i18n.t(i18n.l.points.console.referral_link_bonus_text)}
        />
        <AnimatedText
          color={textColors.account}
          delayStart={1000}
          onComplete={() => {
            setShowShareButtons(true);
          }}
          weight="normal"
          multiline
          textContent={i18n.t(
            i18n.l.points.console.referral_link_bonus_text_extended
          )}
        />
      </Stack>
      <AnimatePresence
        condition={showShareButtons && !!intent?.length}
        duration={300}
      >
        <Bleed horizontal={{ custom: 14 }}>
          <Inline wrap={false} horizontalSpace="12px">
            <NeonButton
              color="#F5F8FF8F"
              label={i18n.t(i18n.l.points.console.skip_referral)}
              onPress={() => {
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
                const beginNextPhase = setTimeout(async () => {
                  if (intent) {
                    Linking.openURL(intent);
                    const shareBonusPointsResponse = await metadataPOSTClient.redeemCodeForPoints(
                      {
                        address: accountAddress,
                        redemptionCode: 'TWITTERSHARED',
                      }
                    );
                    if (shareBonusPointsResponse?.redeemCode?.earnings?.total) {
                      setShareBonusPoints(
                        shareBonusPointsResponse?.redeemCode?.earnings?.total
                      );
                    }
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
