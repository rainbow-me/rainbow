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
import { Stack } from '@/design-system';
import { abbreviateNumber } from '@/helpers/utilities';

export const Calculate = () => {
  const {
    profile,
    rainbowSwaps,
    metamaskSwaps,
    rainbowBridges,
    nftCollections,
    historicBalance,
    bonus,
    hasRetroActivePoints,
    setStep,
  } = usePointsProfileContext();
  const { accountENS, accountAddress } = useAccountProfile();

  const [isCalculationComplete, setIsCalculationComplete] = useState(false);

  const accountName = (abbreviateEnsForDisplay(accountENS, 10) ||
    formatAddress(accountAddress, 4, 5)) as string;

  return (
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
          setAnimationKey(prevKey => prevKey + 1);
          setShowShareButtons(true);
        }}
        weight="normal"
        multiline
        textContent={i18n.t(
          i18n.l.points.console.referral_link_bonus_text_extended
        )}
      />
    </Stack>
  );
};
