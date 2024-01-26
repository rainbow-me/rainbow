import React, { useState } from 'react';
import { AnimatePresence } from '@/components/animations/AnimatePresence';
import Paragraph from '../../components/Paragraph';
import Line from '../../components/Line';
import { AnimatedText } from '../../components/AnimatedText';
import { textColors, rainbowColors } from '../../constants';
import * as i18n from '@/languages';
import { useAccountProfile } from '@/hooks';
import { startOfWeek, endOfWeek, format, subWeeks } from 'date-fns';
import {
  abbreviateEnsForDisplay,
  address as formatAddress,
} from '@/utils/abbreviations';
import { NeonButton } from '../../components/NeonButton';
import LineBreak from '../../components/LineBreak';
import { Bleed, Box, Stack } from '@/design-system';
import { useNavigation } from '@/navigation';
import { analyticsV2 } from '@/analytics';
import { usePoints } from '@/resources/points';
import { abbreviateNumber } from '@/helpers/utilities';

export const ViewWeeklyEarnings = () => {
  const [showCloseButton, setShowCloseButton] = useState(false);

  const { goBack } = useNavigation();
  const { accountENS, accountAddress } = useAccountProfile();
  const { data: points } = usePoints({
    walletAddress: accountAddress,
  });

  // NOTE: Tuesday is the first day of the week since points drop that day
  const weekBegins = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 2 });
  const weekEnds = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 3 });

  const accountName = (abbreviateEnsForDisplay(accountENS, 10) ||
    formatAddress(accountAddress, 4, 5)) as string;

  const newTotalEarnings = points?.points?.user.earnings.total;
  const retroactive =
    points?.points?.user.stats.last_airdrop.differences
      ?.filter(difference => difference && difference.type === 'retroactive')
      .reduce(
        (sum, difference) => sum + (difference?.earnings?.total ?? 0),
        0
      ) || 0;

  const referral =
    points?.points?.user.stats.last_airdrop.differences
      ?.filter(difference => difference && difference.type === 'referral')
      .reduce(
        (sum, difference) => sum + (difference?.earnings?.total ?? 0),
        0
      ) || 0;

  const transaction =
    points?.points?.user.stats.last_airdrop.differences
      ?.filter(difference => difference && difference.type === 'transaction')
      .reduce(
        (sum, difference) => sum + (difference?.earnings?.total ?? 0),
        0
      ) || 0;

  const redemption =
    points?.points?.user.stats.last_airdrop.differences
      ?.filter(difference => difference && difference.type === 'redemption')
      .reduce(
        (sum, difference) => sum + (difference?.earnings?.total ?? 0),
        0
      ) || 0;

  const totalWeeklyEarnings = retroactive + transaction + referral + redemption;

  return (
    <Box height="full" justifyContent="space-between">
      <Stack separator={<LineBreak lines={2} />}>
        <Paragraph>
          <Line>
            <AnimatedText
              delayStart={500}
              color={textColors.gray}
              textContent={`${i18n.t(i18n.l.points.console.account)}:`}
            />
            <AnimatedText
              color={textColors.account}
              textContent={accountName}
            />
          </Line>
          <AnimatedText
            color={textColors.gray}
            textContent={`> ${i18n.t(
              i18n.l.points.console.view_weekly_earnings_week_of,
              {
                startOfWeek: format(weekBegins, 'MMM d'),
                endOfWeek: format(weekEnds, 'MMM d'),
              }
            )}`}
          />
          <Line gap={0}>
            <AnimatedText
              color={textColors.gray}
              delayStart={1000}
              textContent={`> ${i18n.t(
                i18n.l.points.console.view_weekly_earnings_title
              )}`}
            />
            <AnimatedText
              color={textColors.gray}
              textContent="..."
              typingSpeed={500}
            />
          </Line>
        </Paragraph>
        <Stack separator={<LineBreak lines={2} />}>
          {retroactive !== 0 && (
            <Line alignHorizontal="justify">
              <AnimatedText
                color={rainbowColors.purple}
                enableHapticTyping
                textContent={`${i18n.t(
                  i18n.l.points.console.view_weekly_earnings_retroactive_points
                )}:`}
              />
              <AnimatedText
                color={rainbowColors.purple}
                delayStart={1000}
                enableHapticTyping
                textAlign="right"
                textContent={`+ ${abbreviateNumber(retroactive)}`}
                typingSpeed={100}
              />
            </Line>
          )}
          <Line alignHorizontal="justify">
            <AnimatedText
              color={rainbowColors.blue}
              enableHapticTyping
              textContent={`${i18n.t(
                i18n.l.points.console.view_weekly_earnings_activity
              )}:`}
            />
            <AnimatedText
              color={rainbowColors.blue}
              delayStart={1000}
              enableHapticTyping
              textAlign="right"
              textContent={`+ ${abbreviateNumber(transaction)}`}
              typingSpeed={100}
            />
          </Line>
          <Line alignHorizontal="justify">
            <AnimatedText
              color={rainbowColors.green}
              delayStart={1000}
              enableHapticTyping
              textContent={`${i18n.t(
                i18n.l.points.console.view_weekly_earnings_referral_activity
              )}:`}
            />
            <AnimatedText
              color={rainbowColors.green}
              delayStart={1000}
              enableHapticTyping
              textAlign="right"
              textContent={`+ ${abbreviateNumber(referral)}`}
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
        </Stack>
        <Paragraph gap={45}>
          <Line alignHorizontal="justify">
            <AnimatedText
              color={textColors.gray}
              delayStart={1000}
              enableHapticTyping
              textContent={`${i18n.t(
                i18n.l.points.console.view_weekly_earnings_total_earnings
              )}:`}
            />
            <AnimatedText
              color={textColors.white}
              delayStart={1000}
              enableHapticTyping
              textAlign="right"
              textContent={`+ ${abbreviateNumber(
                totalWeeklyEarnings ?? 0
              )} Points`}
              typingSpeed={100}
            />
          </Line>
          <AnimatedText
            color={textColors.gray}
            delayStart={1000}
            textContent={`> ${i18n.t(
              i18n.l.points.console.view_weekly_earnings_counted
            )}`}
          />
        </Paragraph>
        <Paragraph gap={30}>
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
              textContent={`${(newTotalEarnings ?? 0).toLocaleString(
                'en-US'
              )} Points`}
              onComplete={() => {
                const complete = setTimeout(() => {
                  setShowCloseButton(true);
                }, 500);
                return () => clearTimeout(complete);
              }}
              typingSpeed={100}
            />
          </Line>
        </Paragraph>
      </Stack>
      <AnimatePresence condition={showCloseButton} duration={300}>
        <Bleed horizontal={{ custom: 14 }}>
          <NeonButton
            color="#FEC101"
            label={i18n.t(
              i18n.l.points.console.view_weekly_earnings_close_button
            )}
            onPress={() => {
              analyticsV2.track(
                analyticsV2.event
                  .pointsViewedWeeklyEarningsScreenPressedCloseButton
              );
              goBack();
            }}
          />
        </Bleed>
      </AnimatePresence>
    </Box>
  );
};
