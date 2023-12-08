import React, { useCallback, useState } from 'react';
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
import Routes from '@/navigation/routesNames';
import { usePointsProfileContext } from '../../contexts/PointsProfileContext';
import { NeonButton } from '../../components/NeonButton';
import LineBreak from '../../components/LineBreak';
import { Stack } from '@/design-system';
import { navigate } from '@/navigation/Navigation';

export const Review = () => {
  const { clickedShare, setStep } = usePointsProfileContext();
  const { accountENS, accountAddress } = useAccountProfile();

  const [showDoneButton, setShowDoneButton] = useState(false);

  const accountName = (abbreviateEnsForDisplay(accountENS, 10) ||
    formatAddress(accountAddress, 4, 5)) as string;

  const onReviewComplete = useCallback(() => {
    setStep(RainbowPointsFlowSteps.Initialize);
    navigate(Routes.POINTS_SCREEN);
  }, [setStep]);

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
            color={textColors.green}
            textContent={`> ${i18n.t(
              i18n.l.points.console.referral_link_is_ready
            )}`}
          />
        </Paragraph>
        {clickedShare && (
          <Line alignHorizontal="justify">
            <AnimatedText
              color={rainbowColors.yellow}
              delayStart={1000}
              enableHapticTyping
              textContent={`${i18n.t(i18n.l.points.console.share_bonus)}:`}
            />
            <AnimatedText
              color={rainbowColors.yellow}
              delayStart={1000}
              enableHapticTyping
              textAlign="right"
              textContent={`+ 250`} // TODO: Where does this amount come from?
            />
          </Line>
        )}
        <Paragraph>
          <AnimatedText
            delayStart={500}
            color={textColors.gray}
            textContent={`${i18n.t(
              i18n.l.points.console.share_bonus_paragraph_one
            )}:`}
            weight="normal"
          />
          <AnimatedText
            color={textColors.gray}
            delayStart={500}
            textContent={`> ${i18n.t(
              i18n.l.points.console.share_bonus_paragraph_two
            )}`}
            weight="normal"
          />
          <AnimatedText
            color={textColors.gray}
            onComplete={() => setShowDoneButton(true)}
            textContent={`> ${i18n.t(
              i18n.l.points.console.share_bonus_paragraph_three
            )}`}
            weight="normal"
          />
        </Paragraph>
      </Stack>

      <AnimatePresence condition={showDoneButton} duration={300}>
        <NeonButton
          color="#FEC101"
          label={`􀖅 ${i18n.t(i18n.l.points.console.complete_onboarding)}`}
          onPress={onReviewComplete}
        />
      </AnimatePresence>
    </>
  );
};
