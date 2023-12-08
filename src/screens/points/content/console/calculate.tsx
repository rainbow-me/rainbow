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
import { Box, Stack } from '@/design-system';
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
    setAnimationKey,
  } = usePointsProfileContext();
  const { accountENS, accountAddress } = useAccountProfile();

  const [isCalculationComplete, setIsCalculationComplete] = useState(false);

  const accountName = (abbreviateEnsForDisplay(accountENS, 10) ||
    formatAddress(accountAddress, 4, 5)) as string;

  if (hasRetroActivePoints) {
    return (
      <Stack separator={<LineBreak lines={3} />}>
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
          <Line gap={0}>
            <AnimatedText
              color={textColors.gray}
              delayStart={1000}
              textContent={`> ${i18n.t(
                i18n.l.points.console.calculating_points
              )}`}
              weight="normal"
            />
            <AnimatedText
              color={textColors.gray}
              repeat={!isCalculationComplete}
              textContent="..."
              typingSpeed={500}
              weight="normal"
            />
          </Line>
        </Paragraph>
        <Stack separator={<LineBreak lines={2} />}>
          <Line alignHorizontal="justify">
            <AnimatedText
              color={rainbowColors.blue}
              enableHapticTyping
              textContent={`${i18n.t(i18n.l.points.console.rainbow_swaps)}:`}
            />
            <AnimatedText
              color={rainbowColors.blue}
              delayStart={1000}
              enableHapticTyping
              textAlign="right"
              textContent={`$${abbreviateNumber(
                (rainbowSwaps?.data?.usd_amount ?? 0) +
                  (rainbowBridges?.data?.usd_amount ?? 0)
              )}`}
              typingSpeed={100}
            />
          </Line>
          <Line alignHorizontal="justify">
            <AnimatedText
              color={rainbowColors.green}
              delayStart={1000}
              enableHapticTyping
              textContent={`${i18n.t(
                i18n.l.points.console.rainbow_nfts_owned
              )}:`}
            />
            <AnimatedText
              color={rainbowColors.green}
              delayStart={1000}
              enableHapticTyping
              textAlign="right"
              textContent={`${nftCollections?.data?.owned_collections} of ${nftCollections?.data?.total_collections}`}
              typingSpeed={100}
            />
          </Line>
          <Line alignHorizontal="justify">
            <AnimatedText
              color={rainbowColors.yellow}
              delayStart={1000}
              enableHapticTyping
              textContent={`${i18n.t(i18n.l.points.console.wallet_balance)}:`}
            />
            <AnimatedText
              color={rainbowColors.yellow}
              delayStart={1000}
              enableHapticTyping
              textAlign="right"
              textContent={`$${abbreviateNumber(
                historicBalance?.data?.usd_amount ?? 0
              )}`}
              typingSpeed={100}
            />
          </Line>
          <Line alignHorizontal="justify">
            <AnimatedText
              color={rainbowColors.red}
              delayStart={1000}
              enableHapticTyping
              textContent={`${i18n.t(i18n.l.points.console.metamask_swaps)}:`}
            />
            <AnimatedText
              color={rainbowColors.red}
              delayStart={1000}
              enableHapticTyping
              textAlign="right"
              textContent={`$${abbreviateNumber(
                metamaskSwaps?.data?.usd_amount ?? 0
              )}`}
              typingSpeed={100}
            />
          </Line>
          <Line alignHorizontal="justify">
            <AnimatedText
              color={rainbowColors.purple}
              delayStart={1000}
              enableHapticTyping
              textContent={`${i18n.t(i18n.l.points.console.bonus_points)}:`}
            />
            <AnimatedText
              color={rainbowColors.purple}
              delayStart={1000}
              enableHapticTyping
              onComplete={() => {
                setIsCalculationComplete(true);
              }}
              textAlign="right"
              textContent={`+ ${bonus?.earnings?.total}`}
              typingSpeed={100}
            />
          </Line>
        </Stack>
        <Paragraph gap={30}>
          <AnimatedText
            color={textColors.gray}
            delayStart={1000}
            textContent={`> ${i18n.t(
              i18n.l.points.console.calculation_complete
            )}`}
            weight="normal"
          />
          <Line alignHorizontal="justify">
            <AnimatedText
              color={textColors.white}
              delayStart={1000}
              enableHapticTyping
              textContent={`${i18n.t(i18n.l.points.console.points_earned)}:`}
            />
            <AnimatedText
              color={textColors.white}
              delayStart={1000}
              enableHapticTyping
              hapticType="impactHeavy"
              textAlign="right"
              textContent={(
                profile?.onboardPoints?.user.onboarding?.earnings?.total ?? 0
              ).toLocaleString('en-US')}
              typingSpeed={100}
            />
          </Line>
        </Paragraph>
      </Stack>
    );
  }

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
              i18n.l.points.console.calculating_points
            )}`}
          />
        </Paragraph>
        <Line alignHorizontal="justify">
          <AnimatedText
            color={rainbowColors.purple}
            delayStart={1000}
            enableHapticTyping
            textContent={`${i18n.t(i18n.l.points.console.bonus_points)}:`}
          />
          <AnimatedText
            color={rainbowColors.purple}
            delayStart={1000}
            enableHapticTyping
            textAlign="right"
            textContent={`+ ${bonus?.earnings?.total}`}
            typingSpeed={100}
          />
        </Line>
        <AnimatedText
          color={textColors.gray}
          delayStart={1000}
          onComplete={() => {
            setIsCalculationComplete(true);
          }}
          weight="normal"
          multiline
          textContent={i18n.t(i18n.l.points.console.claim_bonus_paragraph)}
        />
      </Stack>
      <AnimatePresence
        condition={isCalculationComplete && !!profile}
        duration={300}
      >
        <NeonButton
          color="#FEC101"
          label={i18n.t(i18n.l.points.console.proceed_to_share)}
          onPress={() => {
            const beginNextPhase = setTimeout(() => {
              setAnimationKey(prevKey => prevKey + 1);
              setStep(RainbowPointsFlowSteps.Share);
            }, 1000);
            return () => clearTimeout(beginNextPhase);
          }}
        />
      </AnimatePresence>
    </Box>
  );
};
