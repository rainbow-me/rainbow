import { analytics } from '@/analytics';
import { AnimatePresence } from '@/components/animations/AnimatePresence';
import { Bleed, Box, Stack } from '@/design-system';
import * as i18n from '@/languages';
import { Navigation } from '@/navigation';
import { usePoints } from '@/resources/points';
import { useAccountAddress, useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { abbreviateEnsForDisplay, address as formatAddress } from '@/utils/abbreviations';
import { addDays, format, startOfWeek, subWeeks } from 'date-fns';
import React, { useState } from 'react';
import { AnimatedText } from '../../components/AnimatedText';
import { Line } from '../../components/Line';
import { LineBreak } from '../../components/LineBreak';
import { NeonButton } from '../../components/NeonButton';
import { Paragraph } from '../../components/Paragraph';
import { rainbowColors, textColors } from '../../constants';

export const ViewWeeklyEarnings = () => {
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [isCalculationComplete, setIsCalculationComplete] = useState(false);

  const { accountENS } = useAccountProfileInfo();
  const accountAddress = useAccountAddress();
  const { data: points } = usePoints({
    walletAddress: accountAddress,
  });

  // NOTE: Tuesday is the first day of the week since points drop that day
  const weekBegins = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 2 });
  const weekEnds = addDays(weekBegins, 7);

  const accountName = (abbreviateEnsForDisplay(accountENS, 10) || formatAddress(accountAddress, 4, 5)) as string;

  const newTotalEarnings = points?.points?.user.earnings.total || 0;
  const retroactive =
    points?.points?.user.stats.last_airdrop.differences
      ?.filter(difference => difference && difference.type === 'retroactive')
      .reduce((sum, difference) => sum + (difference?.earnings?.total ?? 0), 0) || 0;

  const existingReferrals =
    points?.points?.user.stats.last_airdrop.differences
      ?.filter(difference => difference && difference.type === 'referral' && difference.group_id === 'referral_activity')
      .reduce((sum, difference) => sum + (difference?.earnings?.total ?? 0), 0) || 0;

  const newReferrals =
    points?.points?.user.stats.last_airdrop.differences
      ?.filter(difference => difference && difference.type === 'referral' && difference.group_id === 'new_referrals')
      .reduce((sum, difference) => sum + (difference?.earnings?.total ?? 0), 0) || 0;

  const transaction =
    points?.points?.user.stats.last_airdrop.differences
      ?.filter(difference => difference && difference.type === 'transaction')
      .reduce((sum, difference) => sum + (difference?.earnings?.total ?? 0), 0) || 0;

  const bonus =
    points?.points?.user.stats.last_airdrop.differences
      ?.filter(difference => difference && difference.type === 'redemption')
      .reduce((sum, difference) => sum + (difference?.earnings?.total ?? 0), 0) || 0;

  const totalWeeklyEarnings = retroactive + transaction + existingReferrals + newReferrals + bonus;

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
            <AnimatedText enableHapticTyping delayStart={300} color={textColors.account} textContent={accountName} />
          </Line>
          <AnimatedText
            color={textColors.gray}
            delayStart={500}
            weight="normal"
            textContent={`> ${i18n.t(i18n.l.points.console.view_weekly_earnings_week_of, {
              startOfWeek: format(weekBegins, 'MMM d'),
              endOfWeek: format(weekEnds, 'MMM d'),
            })}`}
          />
          <Line gap={0}>
            <AnimatedText
              color={textColors.gray}
              delayStart={500}
              weight="normal"
              textContent={`> ${i18n.t(i18n.l.points.console.view_weekly_earnings_title)}`}
            />
            <AnimatedText
              delayStart={500}
              color={textColors.gray}
              repeat={!isCalculationComplete}
              textContent="..."
              typingSpeed={500}
              weight="normal"
            />
          </Line>
        </Paragraph>
        <Stack separator={<LineBreak lines={2} />}>
          {retroactive !== 0 && (
            <Line alignHorizontal="justify">
              <AnimatedText
                color={rainbowColors.purple}
                enableHapticTyping
                textContent={`${i18n.t(i18n.l.points.console.view_weekly_earnings_retroactive_points)}:`}
              />
              <AnimatedText
                color={rainbowColors.purple}
                delayStart={1000}
                enableHapticTyping
                textAlign="right"
                textContent={`+ ${retroactive.toLocaleString('en-US')}`}
                typingSpeed={100}
              />
            </Line>
          )}
          {bonus !== 0 && (
            <Line alignHorizontal="justify">
              <AnimatedText
                color={rainbowColors.red}
                enableHapticTyping
                textContent={`${i18n.t(i18n.l.points.console.view_weekly_earnings_bonus_points)}:`}
              />
              <AnimatedText
                color={rainbowColors.red}
                delayStart={1000}
                enableHapticTyping
                textAlign="right"
                textContent={`+ ${bonus.toLocaleString('en-US')}`}
                typingSpeed={100}
              />
            </Line>
          )}
          <Line alignHorizontal="justify">
            <AnimatedText
              color={rainbowColors.blue}
              enableHapticTyping
              textContent={`${i18n.t(i18n.l.points.console.view_weekly_earnings_activity)}:`}
            />
            <AnimatedText
              color={rainbowColors.blue}
              delayStart={1000}
              enableHapticTyping
              textAlign="right"
              textContent={`+ ${transaction.toLocaleString('en-US')}`}
              typingSpeed={100}
            />
          </Line>
          <Line alignHorizontal="justify">
            <AnimatedText
              color={rainbowColors.green}
              delayStart={1000}
              enableHapticTyping
              textContent={`${i18n.t(i18n.l.points.console.view_weekly_earnings_referral_activity)}:`}
            />
            <AnimatedText
              color={rainbowColors.green}
              delayStart={1000}
              enableHapticTyping
              textAlign="right"
              textContent={`+ ${existingReferrals.toLocaleString('en-US')}`}
              typingSpeed={100}
            />
          </Line>
          <Line alignHorizontal="justify">
            <AnimatedText
              color={rainbowColors.yellow}
              delayStart={1000}
              enableHapticTyping
              textContent={`${i18n.t(i18n.l.points.console.view_weekly_earnings_new_referrals)}:`}
            />
            <AnimatedText
              color={rainbowColors.yellow}
              delayStart={1000}
              enableHapticTyping
              textAlign="right"
              textContent={`+ ${newReferrals.toLocaleString('en-US')}`}
              typingSpeed={100}
            />
          </Line>
          {/* <Line alignHorizontal="justify">
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
              textContent={`$${abbreviateNumber(0)}`}
              typingSpeed={100}
            />
          </Line> */}
          <Line alignHorizontal="justify">
            <AnimatedText
              color={textColors.gray}
              delayStart={1000}
              weight="normal"
              enableHapticTyping
              textContent={`${i18n.t(i18n.l.points.console.view_weekly_earnings_total_earnings)}:`}
            />
            <AnimatedText
              color={textColors.white}
              delayStart={1000}
              enableHapticTyping
              textAlign="right"
              onComplete={() => {
                const complete = setTimeout(() => {
                  setIsCalculationComplete(true);
                }, 500);
                return () => clearTimeout(complete);
              }}
              textContent={`+ ${totalWeeklyEarnings.toLocaleString('en-US')} ${i18n.t(i18n.l.points.console.points)}`}
              typingSpeed={100}
            />
          </Line>
        </Stack>
        <Stack separator={<LineBreak lines={2} />}>
          <AnimatedText
            color={textColors.gray}
            delayStart={1000}
            weight="normal"
            textContent={`> ${i18n.t(i18n.l.points.console.view_weekly_earnings_counted)}`}
          />
          <Line alignHorizontal="justify">
            <AnimatedText
              color={textColors.white}
              delayStart={1000}
              enableHapticTyping
              textContent={`${i18n.t(i18n.l.points.console.points_you_have)}:`}
            />
            <AnimatedText
              color={textColors.white}
              delayStart={1000}
              enableHapticTyping
              hapticType="impactHeavy"
              textAlign="right"
              textContent={`${newTotalEarnings.toLocaleString('en-US')} ${i18n.t(i18n.l.points.console.points)}`}
              onComplete={() => {
                const complete = setTimeout(() => {
                  setShowCloseButton(true);
                }, 500);
                return () => clearTimeout(complete);
              }}
              typingSpeed={100}
            />
          </Line>
        </Stack>
      </Stack>
      <AnimatePresence condition={showCloseButton} duration={300}>
        <Bleed horizontal={{ custom: 14 }}>
          <NeonButton
            color="#FEC101"
            label={i18n.t(i18n.l.points.console.view_weekly_earnings_close_button)}
            onPress={() => {
              analytics.track(analytics.event.pointsViewedWeeklyEarningsScreenPressedCloseButton);
              Navigation.goBack();
            }}
          />
        </Bleed>
      </AnimatePresence>
    </Box>
  );
};
