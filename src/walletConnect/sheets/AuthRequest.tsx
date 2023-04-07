import React from 'react';
import { useNavigation } from '@react-navigation/native';

import {
  Box,
  Text,
  Separator,
  BackgroundProvider,
  AccentColorProvider,
} from '@/design-system';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import useAccountProfile from '@/hooks/useAccountProfile';
import { ImgixImage } from '@/components/images';
import { initials } from '@/utils/formatters';
import { useTheme } from '@/theme';
import Routes from '@/navigation/routesNames';
import { AuthRequestAuthenticateSignature } from '@/walletConnect/types';
import { Alert } from '@/components/alerts';
import * as lang from '@/languages';

export function AuthRequest({
  requesterMeta,
  authenticate,
}: {
  requesterMeta: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  authenticate: AuthRequestAuthenticateSignature;
}) {
  const { navigate, goBack } = useNavigation();
  const {
    accountAddress,
    accountSymbol,
    accountColor,
    accountImage,
    accountName,
  } = useAccountProfile();
  const [loadError, setLoadError] = React.useState(false);
  const { colors } = useTheme();

  const auth = React.useCallback(async () => {
    const { success } = await authenticate({ address: accountAddress });

    if (!success) {
      Alert({
        title: lang.t(lang.l.walletconnect.auth.error_alert_title),
        message: lang.t(lang.l.walletconnect.auth.error_alert_description),
      });
    } else {
      goBack(); // close
    }
  }, [accountAddress, authenticate, goBack]);

  const { icons, name, url } = requesterMeta;

  return (
    <>
      <Box alignItems="center">
        <Box paddingBottom="36px">
          <Text color={'label'} weight={'heavy'} size={'20pt'} align="center">
            {lang.t(lang.l.walletconnect.auth.signin_title)}
          </Text>
        </Box>

        <Box paddingBottom="24px" alignItems="center">
          <Box
            width={{ custom: 54 }}
            height={{ custom: 54 }}
            borderRadius={14}
            overflow="hidden"
            justifyContent="center"
            alignItems="center"
            background="accent"
          >
            {icons[0] && !loadError ? (
              <Box
                as={ImgixImage}
                onError={() => setLoadError(true)}
                source={{
                  uri: icons[0],
                }}
                size={100}
                height={{ custom: 54 }}
                width={{ custom: 54 }}
                borderRadius={14}
              />
            ) : (
              <Text align="center" color="label" size="20pt" weight="semibold">
                {initials(name)}
              </Text>
            )}
          </Box>
        </Box>

        <Box paddingBottom="16px" width={{ custom: 281 }}>
          <Text
            color={'label'}
            weight={'semibold'}
            size={'17pt'}
            align="center"
          >
            {lang.t(lang.l.walletconnect.auth.signin_prompt, { name })}
          </Text>
        </Box>

        <Box paddingBottom="36px">
          <Text color={'accent'} weight={'bold'} size={'17pt'} align="center">
            {url}
          </Text>
        </Box>

        <Box paddingBottom="36px">
          <ButtonPressAnimation
            onPress={() => {
              navigate(Routes.CHANGE_WALLET_SHEET, {
                currentAccountAddress: accountAddress,
              });
            }}
          >
            <Box
              padding="10px"
              paddingRight="16px"
              background="fillSecondary"
              borderRadius={18}
              flexDirection="row"
              alignItems="center"
            >
              <AccentColorProvider
                color={colors.avatarBackgrounds[accountColor] || 'fill'}
              >
                <Box
                  background="accent"
                  borderRadius={100}
                  width={{ custom: 36 }}
                  height={{ custom: 36 }}
                  alignItems="center"
                  justifyContent="center"
                >
                  {accountImage ? (
                    <Box
                      as={ImgixImage}
                      source={{ uri: accountImage }}
                      size={100}
                      borderRadius={36}
                      height={{ custom: 36 }}
                      width={{ custom: 36 }}
                    />
                  ) : (
                    <Text
                      color="label"
                      size="20pt"
                      weight="semibold"
                      align="center"
                      containsEmoji={true}
                    >
                      {accountSymbol as string}
                    </Text>
                  )}
                </Box>
              </AccentColorProvider>

              <Box paddingLeft="10px" paddingRight="16px">
                <Box paddingBottom="6px">
                  <Text color="labelSecondary" size="13pt" weight="semibold">
                    {lang.t(lang.l.walletconnect.auth.signin_with)}
                  </Text>
                </Box>

                <Text color="label" size="15pt" weight="bold">
                  {accountName}
                </Text>
              </Box>
              <Text color="label" size="15pt" weight="bold">
                􀆏
              </Text>
            </Box>
          </ButtonPressAnimation>
        </Box>

        <Box paddingBottom="36px" width={{ custom: 166 }}>
          <Separator color="separatorTertiary" />
        </Box>

        <ButtonPressAnimation onPress={auth}>
          <AccentColorProvider color="blue">
            <BackgroundProvider color="accent">
              {({ backgroundColor }) => (
                <Box
                  /* @ts-ignore */
                  background={backgroundColor}
                  paddingVertical="16px"
                  paddingHorizontal="32px"
                  borderRadius={50}
                >
                  <Text color="label" size="17pt" weight="heavy">
                    􀎽 {lang.t(lang.l.walletconnect.auth.signin_button)}
                  </Text>
                </Box>
              )}
            </BackgroundProvider>
          </AccentColorProvider>
        </ButtonPressAnimation>

        <Box paddingTop="24px" width={{ custom: 245 }}>
          <Text
            color={'labelQuaternary'}
            weight={'semibold'}
            size={'13pt'}
            align="center"
          >
            {lang.t(lang.l.walletconnect.auth.signin_notice)}
          </Text>
        </Box>
      </Box>
    </>
  );
}
