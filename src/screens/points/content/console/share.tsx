import React, { useState } from 'react';
import { AnimatePresence } from '@/components/animations/AnimatePresence';
import Paragraph from '../../components/Paragraph';
import Line from '../../components/Line';
import { AnimatedText } from '../../components/AnimatedText';
import {
  RainbowPointsFlowSteps,
  rainbowColors,
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
import LineBreak from '../../components/LineBreak';
import { Inline, Stack } from '@/design-system';
import { Linking } from 'react-native';

export const Share = () => {
  const { intent, setStep } = usePointsProfileContext();
  const { accountENS, accountAddress } = useAccountProfile();

  const [showShareButtons, setShowShareButtons] = useState(false);

  const accountName = (abbreviateEnsForDisplay(accountENS, 10) ||
    formatAddress(accountAddress, 4, 5)) as string;

  return (
    <>
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
          color={rainbowColors.yellow}
          delayStart={1000}
          weight="normal"
          multiline
          textContent={`${i18n.t(
            i18n.l.points.console.referral_link_bonus_text
          )}:`}
        />
        <AnimatedText
          color={rainbowColors.yellow}
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
        <Inline wrap={false} horizontalSpace={{ custom: 12 }}>
          <NeonButton
            color="#F5F8FF8F"
            label={`􀖅 ${i18n.t(i18n.l.points.console.skip_referral)}`}
            onPress={() => setStep(RainbowPointsFlowSteps.Review)}
          />

          <NeonButton
            color="#FEC101"
            label={`􀖅 ${i18n.t(i18n.l.points.console.proceed_to_share)}`}
            onPress={() => {
              if (intent) {
                Linking.openURL(intent);
              }
              setStep(RainbowPointsFlowSteps.Review);
            }}
          />
        </Inline>
      </AnimatePresence>
    </>
  );
};
