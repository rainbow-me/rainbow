import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Web3WalletTypes } from '@walletconnect/web3wallet';

import { Box, Text, Separator, BackgroundProvider, AccentColorProvider } from '@/design-system';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { ImgixImage } from '@/components/images';
import { initials } from '@/utils/formatters';
import { useTheme } from '@/theme';
import Routes from '@/navigation/routesNames';
import { AuthRequestAuthenticateSignature, AuthRequestResponseErrorReason } from '@/walletConnect/types';
import { Alert } from '@/components/alerts';
import * as lang from '@/languages';
import { getAccountProfileInfo } from '@/helpers/accountInfo';
import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { Verify } from '@walletconnect/types';
import { useDappMetadata } from '@/resources/metadata/dapp';
import { DAppStatus } from '@/graphql/__generated__/metadata';
import { InfoAlert } from '@/components/info-alert/info-alert';

export function AuthRequest({
  requesterMeta,
  authenticate,
  verifiedData,
}: {
  requesterMeta: Web3WalletTypes.AuthRequest['params']['requester']['metadata'];
  authenticate: AuthRequestAuthenticateSignature;
  verifiedData?: Verify.Context['verified'];
}) {
  const { accountAddress } = useSelector((state: AppState) => ({
    accountAddress: state.settings.accountAddress,
  }));
  const { wallets, walletNames } = useSelector((state: AppState) => ({
    wallets: state.wallets.wallets,
    walletNames: state.wallets.walletNames,
  }));

  const { navigate, goBack } = useNavigation();
  const { colors } = useTheme();
  const [loadError, setLoadError] = React.useState(false);
  const [address, setAddress] = React.useState(accountAddress);

  const { accountSymbol, accountColor, accountImage, accountName, isHardwareWallet } = React.useMemo(() => {
    const selectedWallet = findWalletWithAccount(wallets!, address);
    const profileInfo = getAccountProfileInfo(selectedWallet, walletNames, address);
    return {
      ...profileInfo,
      isHardwareWallet: !!selectedWallet?.deviceId,
    };
  }, [walletNames, wallets, address]);

  const auth = React.useCallback(async () => {
    const { success, reason } = await authenticate({ address });

    if (!success) {
      switch (reason) {
        case AuthRequestResponseErrorReason.ReadOnly:
          Alert({
            message: `Please switch to a different wallet to sign this request`,
            title: `Cannot sign with this wallet`,
          });
          break;
        default:
          Alert({
            title: lang.t(lang.l.walletconnect.auth.error_alert_title),
            message: lang.t(lang.l.walletconnect.auth.error_alert_description),
          });
      }
    } else {
      goBack(); // close

      if (isHardwareWallet) {
        // Ledger flow sheets close, then we close AuthRequest sheet
        goBack();
      }
    }
  }, [address, authenticate, goBack, isHardwareWallet]);

  const { icons, name, url } = requesterMeta;

  const dappUrl = verifiedData?.origin || url;
  const { data: metadata } = useDappMetadata({ url: dappUrl });

  const isScam = metadata?.status === DAppStatus.Scam;

  const accentColor = isScam ? 'red' : 'blue';

  return (
    <>
      <Box alignItems="center">
        <Box paddingBottom="36px">
          <Text color={'label'} weight={'heavy'} size={'20pt'} align="center">
            {lang.t(lang.l.walletconnect.auth.signin_title)}
          </Text>
        </Box>
        <AccentColorProvider color={accentColor}>
          <BackgroundProvider color="accent">
            {({ backgroundColor }) => (
              <Box paddingBottom="24px" alignItems="center">
                <Box
                  width={{ custom: 54 }}
                  height={{ custom: 54 }}
                  borderRadius={14}
                  overflow="hidden"
                  justifyContent="center"
                  alignItems="center"
                  /* @ts-ignore */
                  background={backgroundColor}
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
            )}
          </BackgroundProvider>
        </AccentColorProvider>

        <Box paddingBottom="16px" width={{ custom: 281 }}>
          <Text color={'label'} weight={'semibold'} size={'17pt'} align="center">
            {lang.t(lang.l.walletconnect.auth.signin_prompt, { name })}
          </Text>
        </Box>

        <Box paddingBottom="36px">
          <Text color={isScam ? { custom: accentColor } : 'accent'} weight={'bold'} size={'17pt'} align="center">
            {url}
          </Text>
        </Box>
        <Box paddingBottom={isScam ? '16px' : '36px'}>
          <ButtonPressAnimation
            onPress={() => {
              navigate(Routes.CHANGE_WALLET_SHEET, {
                watchOnly: true,
                currentAccountAddress: address,
                onChangeWallet(address: string) {
                  setAddress(address);
                  goBack();
                },
              });
            }}
          >
            <Box padding="10px" paddingRight="16px" background="fillSecondary" borderRadius={18} flexDirection="row" alignItems="center">
              <AccentColorProvider color={colors.avatarBackgrounds[accountColor] || 'fill'}>
                <Box
                  background="accent"
                  borderRadius={100}
                  width={{ custom: 36 }}
                  height={{ custom: 36 }}
                  alignItems="center"
                  justifyContent="center"
                  shadow="18px"
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
                    <Text color="label" size="20pt" weight="semibold" align="center" containsEmoji={true}>
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

                <Box style={{ maxWidth: 200 }}>
                  <Text color="label" size="15pt" weight="bold" ellipsizeMode="middle" numberOfLines={1}>
                    {accountName}
                  </Text>
                </Box>
              </Box>
              <Text color="label" size="15pt" weight="bold">
                􀆏
              </Text>
            </Box>
          </ButtonPressAnimation>
        </Box>

        {!isScam && (
          <Box paddingBottom="36px" width={{ custom: 166 }}>
            <Separator color="separatorTertiary" />
          </Box>
        )}

        {isScam && (
          <Box paddingHorizontal={'16px'} paddingVertical={'16px'}>
            <InfoAlert
              rightIcon={
                <Text size="15pt" color={{ custom: accentColor }}>
                  􀘰
                </Text>
              }
              title={lang.t(lang.l.walletconnect.dapp_warnings.info_alert.title)}
              description={lang.t(lang.l.walletconnect.dapp_warnings.info_alert.description)}
            />
          </Box>
        )}

        <ButtonPressAnimation onPress={auth}>
          <AccentColorProvider color={accentColor}>
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
          <Text color={'labelQuaternary'} weight={'semibold'} size={'13pt'} align="center">
            {lang.t(lang.l.walletconnect.auth.signin_notice)}
          </Text>
        </Box>
      </Box>
    </>
  );
}
