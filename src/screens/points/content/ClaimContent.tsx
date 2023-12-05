import React from 'react';
import { navbarHeight } from '@/components/navbar/Navbar';
import { Box, Stack, Text } from '@/design-system';
import { useAccountAccentColor, useDimensions, useWallets } from '@/hooks';
import { useNavigation } from '@/navigation';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';
import { ActionButton } from '@/screens/points/components/ActionButton';
import { PointsIconAnimation } from '../components/PointsIconAnimation';
import { watchingAlert } from '@/utils';

export default function ClaimContent() {
  const { accentColor } = useAccountAccentColor();
  const { navigate } = useNavigation();
  const { height: deviceHeight } = useDimensions();
  const { isReadOnlyWallet } = useWallets();

  const contentBottom =
    TAB_BAR_HEIGHT + (deviceHeight - navbarHeight - 218) / 2;

  return (
    <Box
      background="surfacePrimary"
      height="full"
      alignItems="center"
      justifyContent="flex-end"
      paddingHorizontal="60px"
      paddingBottom={{ custom: 132 }}
    >
      <Box position="absolute" bottom={{ custom: contentBottom }}>
        <Stack space="32px" alignHorizontal="center">
          <Stack space="20px" alignHorizontal="center">
            <Stack space="28px" alignHorizontal="center">
              <PointsIconAnimation />
              <Text size="22pt" weight="heavy" align="center" color="label">
                {i18n.t(i18n.l.points.claim.title)}
              </Text>
            </Stack>
            <Text
              size="15pt"
              weight="semibold"
              align="center"
              color="labelTertiary"
            >
              {i18n.t(i18n.l.points.claim.subtitle)}
            </Text>
          </Stack>
          <ActionButton
            color={accentColor}
            label={i18n.t(i18n.l.points.claim.get_started)}
            onPress={() =>
              isReadOnlyWallet
                ? watchingAlert()
                : navigate(Routes.CONSOLE_SHEET)
            }
          />
        </Stack>
      </Box>
      <ActionButton
        color={accentColor}
        label={i18n.t(i18n.l.points.claim.use_referral_code)}
        onPress={() => navigate('ReferralContent')}
        outline
        small
      />
    </Box>
  );
}
