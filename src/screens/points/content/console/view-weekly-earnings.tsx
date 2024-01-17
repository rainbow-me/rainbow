import React, { useState } from 'react';
import { AnimatePresence } from '@/components/animations/AnimatePresence';
import Paragraph from '../../components/Paragraph';
import Line from '../../components/Line';
import { AnimatedText } from '../../components/AnimatedText';
import { textColors, rainbowColors } from '../../constants';
import * as i18n from '@/languages';
import { useAccountProfile } from '@/hooks';
import { startOfWeek, endOfWeek, format } from 'date-fns';
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
  const { accountENS, accountAddress } = useAccountProfile();
  const { goBack } = useNavigation();

  const { data: points } = usePoints({
    walletAddress: accountAddress,
  });

  const weekBegins = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnds = endOfWeek(new Date(), { weekStartsOn: 1 });

  const [showCloseButton, setShowCloseButton] = useState(false);

  const accountName = (abbreviateEnsForDisplay(accountENS, 10) ||
    formatAddress(accountAddress, 4, 5)) as string;

  console.log(JSON.stringify(points?.points, null, 2));

  return (
    <Box height="full" justifyContent="space-between">
      <Stack separator={<LineBreak lines={2} />}>
        <Paragraph>
          <Line>
            <AnimatedText
              delayStart={500}
              color={textColors.gray}
              textContent={`${i18n.t(i18n.l.points.console.account)}:`}
              weight="normal"
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
              weight="normal"
            />
            <AnimatedText
              color={textColors.gray}
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
              textContent={`$${abbreviateNumber(0)}`}
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
              textContent={`${abbreviateNumber(0)}`}
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
              textContent={`$${abbreviateNumber(0)}`}
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
              textContent={`${i18n.t(i18n.l.points.console.points_you_have)}:`}
            />
            <AnimatedText
              color={textColors.white}
              delayStart={1000}
              enableHapticTyping
              hapticType="impactHeavy"
              textAlign="right"
              textContent={`${(
                points?.points?.user.stats.last_airdrop.earnings.total ?? 0
              ).toLocaleString('en-US')} Points`}
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
