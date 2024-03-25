import React, { useCallback } from 'react';
import { AccentColorProvider, Box, Text, TextIcon, useForegroundColor } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { useNavigation } from '@/navigation';
import { deviceUtils, watchingAlert } from '@/utils';
import { PointsIconAnimation } from './components/PointsIconAnimation';
import { useAccountAccentColor, useAccountProfile, useWallets } from '@/hooks';
import { IS_IOS } from '@/env';
import * as i18n from '@/languages';
import { useTheme } from '@/theme';
import Routes from '@/navigation/routesNames';
import { metadataPOSTClient } from '@/graphql';

export default function ClaimPointsScreen() {
  const { accountAddress } = useAccountProfile();
  const { goBack, navigate } = useNavigation();
  const { isReadOnlyWallet } = useWallets();
  const { isDarkMode } = useTheme();
  const { accentColor } = useAccountAccentColor();
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const isError = false;
  const numPoints = 100;

  const TRANSLATIONS = i18n.l.points.find[isError ? 'failure' : 'success'];

  const claimPoints = useCallback(() => metadataPOSTClient.redeemCodeForPoints({ address: accountAddress, redemptionCode: '' }), []);

  return (
    <AccentColorProvider color={accentColor}>
      <Box as={ButtonPressAnimation} onPress={goBack} height="full" width="full" />
      <Box
        height="full"
        width="full"
        alignItems="center"
        justifyContent="center"
        position="absolute"
        pointerEvents="box-none"
        paddingHorizontal="20px"
      >
        <Box
          background="surfacePrimaryElevated"
          width="full"
          style={{ borderWidth: 1, borderColor: separatorSecondary }}
          alignItems="center"
          paddingHorizontal={{ custom: 40 }}
          paddingBottom={{ custom: 60 }}
          borderRadius={30}
        >
          <Box
            width={{ custom: deviceUtils.dimensions.width - 40 }}
            paddingTop="16px"
            paddingRight="16px"
            marginHorizontal={{ custom: -40 }}
            paddingBottom="20px"
            alignItems="flex-end"
          >
            <Box
              as={ButtonPressAnimation}
              onPress={goBack}
              borderRadius={32}
              width={{ custom: 28 }}
              height={{ custom: 28 }}
              paddingLeft={{ custom: IS_IOS ? 1 : 0 }}
              style={{ borderWidth: 1, borderColor: separatorSecondary, backgroundColor: isDarkMode ? '#F5F8FF0F' : '#1B1D1F0F' }}
              alignItems="center"
              justifyContent="center"
            >
              <TextIcon align="center" color="label" weight="heavy" size="13pt">
                􀆄
              </TextIcon>
            </Box>
          </Box>
          <PointsIconAnimation />
          <Box paddingTop="28px" paddingBottom="32px" gap={20}>
            <Text align="center" color="label" weight="heavy" size="22pt">
              {i18n.t(TRANSLATIONS.title, { numPoints })}
            </Text>
            <Text align="center" color="labelTertiary" weight="semibold" size="15pt">
              {i18n.t(TRANSLATIONS.description)}
            </Text>
          </Box>
          <Box gap={20}>
            {!isError && (
              <ButtonPressAnimation overflowMargin={50} onPress={isReadOnlyWallet ? watchingAlert : () => {}}>
                <Box
                  background="accent"
                  borderRadius={26}
                  paddingHorizontal="24px"
                  alignItems="center"
                  justifyContent="center"
                  height={{ custom: 48 }}
                  shadow="30px accent"
                >
                  <Text align="center" color="label" weight="heavy" size="20pt">
                    {i18n.t((TRANSLATIONS as typeof i18n.l.points.find.success).accent_button_title)}
                  </Text>
                </Box>
              </ButtonPressAnimation>
            )}
            <ButtonPressAnimation onPress={isError ? goBack : () => navigate(Routes.CHANGE_WALLET_SHEET)}>
              <Box
                borderRadius={26}
                paddingHorizontal="24px"
                alignItems="center"
                justifyContent="center"
                height={{ custom: 48 }}
                style={{ borderWidth: 2, borderColor: separatorSecondary }}
              >
                <Text align="center" color="accent" weight="heavy" size="20pt">
                  {i18n.t(TRANSLATIONS.outline_button_title)}
                </Text>
              </Box>
            </ButtonPressAnimation>
          </Box>
        </Box>
      </Box>
    </AccentColorProvider>
  );
}
