import { analytics } from '@/analytics';
import { ETH_REWARDS, useExperimentalFlag } from '@/config';
import { Box, Row, Rows, Stack, Text, globalColors, useColorMode } from '@/design-system';
import { useAccountAccentColor } from '@/hooks';
import * as i18n from '@/languages';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { ActionButton } from '@/screens/points/components/ActionButton';
import { watchingAlert } from '@/utils';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { PointsIconAnimation } from '../components/PointsIconAnimation';
import { POINTS_ROUTES } from '../PointsScreen';

export function ClaimContent() {
  const { accentColor } = useAccountAccentColor();
  const { isDarkMode } = useColorMode();
  const { navigate } = useNavigation();
  const { rewards_enabled } = useRemoteConfig();
  const isReadOnlyWallet = useWalletsStore(state => state.getIsReadOnlyWallet());

  const rewardsEnabled = useExperimentalFlag(ETH_REWARDS) || rewards_enabled;

  useFocusEffect(
    useCallback(() => {
      analytics.track(analytics.event.pointsViewedClaimScreen);
    }, [])
  );

  return (
    <Box
      alignItems="center"
      paddingBottom="52px"
      paddingHorizontal={{ custom: 68 }}
      style={{ backgroundColor: isDarkMode ? globalColors.grey100 : '#FBFCFD', flex: 1 }}
    >
      <Rows>
        <Box alignItems="center" justifyContent="center" style={{ flex: 1 }}>
          <Stack space="32px" alignHorizontal="center">
            <Stack space="20px" alignHorizontal="center">
              <Stack space="28px" alignHorizontal="center">
                <PointsIconAnimation />
                <Text size="22pt" weight="heavy" align="center" color="label">
                  {rewardsEnabled
                    ? `${i18n.t(i18n.l.points.claim.title_rewards_line_1)}\n${i18n.t(i18n.l.points.claim.title_rewards_line_2)}`
                    : i18n.t(i18n.l.points.claim.title)}
                </Text>
              </Stack>
              <Text size="15pt" weight="semibold" align="center" color="labelTertiary">
                {rewardsEnabled ? i18n.t(i18n.l.points.claim.subtitle_rewards) : i18n.t(i18n.l.points.claim.subtitle)}
              </Text>
            </Stack>
            <ActionButton
              color={accentColor}
              label={i18n.t(i18n.l.points.claim.get_started)}
              onPress={() => (isReadOnlyWallet ? watchingAlert() : navigate(Routes.CONSOLE_SHEET))}
            />
          </Stack>
        </Box>
        <Row height="content">
          <ActionButton
            color={accentColor}
            label={i18n.t(i18n.l.points.claim.use_referral_code)}
            onPress={() => (isReadOnlyWallet ? watchingAlert() : navigate(POINTS_ROUTES.REFERRAL_CONTENT))}
            outline
            small
          />
        </Row>
      </Rows>
    </Box>
  );
}
