import React, { useState } from 'react';
import { AnimatePresence } from '@/components/animations/AnimatePresence';
import { Paragraph } from '../../components/Paragraph';
import { Line } from '../../components/Line';
import { AnimatedText } from '../../components/AnimatedText';
import { textColors } from '../../constants';
import * as i18n from '@/languages';
import { useAccountProfile } from '@/hooks';
import { abbreviateEnsForDisplay, address as formatAddress } from '@/utils/abbreviations';
import { NeonButton } from '../../components/NeonButton';
import { LineBreak } from '../../components/LineBreak';
import { Bleed, Box, Stack } from '@/design-system';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

export const RequireWalletBalance = () => {
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const { accountENS, accountAddress } = useAccountProfile();
  const { navigate } = useNavigation();

  const accountName = (abbreviateEnsForDisplay(accountENS, 10) || formatAddress(accountAddress, 4, 5)) as string;
  return (
    <Box height="full" justifyContent="space-between">
      <Stack separator={<LineBreak lines={3} />}>
        <Paragraph>
          <Line>
            <AnimatedText color={textColors.gray} textContent={`${i18n.t(i18n.l.points.console.account)}:`} skipAnimation weight="normal" />
            <AnimatedText color={textColors.account} skipAnimation textContent={accountName} />
          </Line>
          <AnimatedText
            color={textColors.red}
            delayStart={500}
            textContent={`> ${i18n.t(i18n.l.points.console.wallet_balance_required)}`}
            weight="normal"
          />
        </Paragraph>
        <Stack separator={<LineBreak lines={2} />}>
          <AnimatedText
            color={textColors.gray}
            delayStart={1000}
            weight="normal"
            multiline
            textContent={i18n.t(i18n.l.points.console.require_balance_paragraph_one)}
          />
          <Paragraph gap={10}>
            <AnimatedText color={textColors.gray} delayStart={500} weight="normal" textContent={' - Ethereum'} />
            <AnimatedText color={textColors.gray} delayStart={500} weight="normal" textContent={' - Arbitrum'} />
            <AnimatedText color={textColors.gray} delayStart={500} weight="normal" textContent={' - Optimism'} />
            <AnimatedText color={textColors.gray} delayStart={500} weight="normal" textContent={' - Base'} />
            <AnimatedText color={textColors.gray} delayStart={500} weight="normal" textContent={' - Zora'} />
          </Paragraph>
          <AnimatedText
            color={textColors.gray}
            delayStart={500}
            onComplete={() => {
              const complete = setTimeout(() => {
                setShouldShowButton(true);
              }, 500);
              return () => clearTimeout(complete);
            }}
            weight="normal"
            multiline
            textContent={i18n.t(i18n.l.points.console.require_balance_paragraph_two)}
          />
        </Stack>
      </Stack>
      <AnimatePresence condition={shouldShowButton} duration={300}>
        <Bleed horizontal={{ custom: 14 }}>
          <NeonButton
            color="#FEC101"
            label={i18n.t(i18n.l.points.console.fund_my_wallet)}
            onPress={() => navigate(Routes.ADD_CASH_SHEET)}
          />
        </Bleed>
      </AnimatePresence>
    </Box>
  );
};
