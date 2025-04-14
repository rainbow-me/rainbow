import React from 'react';
import { useNavigation } from '@react-navigation/native';

import { Box, Text, Separator, BackgroundProvider, AccentColorProvider } from '@/design-system';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { ImgixImage } from '@/components/images';
import { initials } from '@/utils/formatters';
import { useTheme } from '@/theme';
import Routes from '@/navigation/routesNames';
import { AuthRequestResponseErrorReason } from '@/walletConnect/types';
import * as lang from '@/languages';
import { getAccountProfileInfo } from '@/helpers/accountInfo';
import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { InfoAlert } from '@/components/info-alert/info-alert';
import { WalletKitTypes } from '@reown/walletkit';
import { Address } from 'viem';
import { useWcAuthStore, WcAuthState } from '@/state/walletConnect/wcAuthStore';

interface AuthRequestBodyProps {
  requesterMeta: WalletKitTypes.SessionProposal['params']['proposer']['metadata'];
  isScam: boolean;
}

export function AuthRequestBody({ requesterMeta, isScam }: AuthRequestBodyProps) {
  const address = useWcAuthStore((state: WcAuthState) => state.address);
  const setAddress = useWcAuthStore((state: WcAuthState) => state.setAddress);

  const { wallets, walletNames } = useSelector((state: AppState) => ({
    wallets: state.wallets.wallets,
    walletNames: state.wallets.walletNames,
  }));

  const { navigate, goBack } = useNavigation();
  const { colors } = useTheme();
  const [loadError, setLoadError] = React.useState(false);

  const { accountSymbol, accountColor, accountImage, accountName } = React.useMemo(() => {
    if (!address) return { accountSymbol: '', accountColor: 0, accountImage: null, accountName: '' };
    const selectedWallet = findWalletWithAccount(wallets!, address);
    const profileInfo = getAccountProfileInfo(selectedWallet, walletNames, address);
    return {
      ...profileInfo,
    };
  }, [walletNames, wallets, address]);

  const { icons, name, url } = requesterMeta;
  const accentColor = isScam ? 'red' : 'blue';

  return (
    <>
      {/* DApp Logo */}
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
                /* @ts-expect-error - backgroundColor weird typing */
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

      {/* Prompt Text */}
      <Box paddingBottom="16px" width={{ custom: 281 }}>
        <Text color={'label'} weight={'semibold'} size={'17pt'} align="center">
          {lang.t(lang.l.walletconnect.auth.signin_prompt, { name })}
        </Text>
      </Box>

      {/* DApp URL */}
      <Box paddingBottom="36px">
        <Text color={isScam ? { custom: accentColor } : 'accent'} weight={'bold'} size={'17pt'} align="center">
          {url}
        </Text>
      </Box>

      {/* Wallet Selector Button */}
      <Box paddingBottom={isScam ? '16px' : '36px'}>
        <ButtonPressAnimation
          onPress={() => {
            if (!address) return;
            navigate(Routes.CHANGE_WALLET_SHEET, {
              watchOnly: true,
              currentAccountAddress: address,
              onChangeWallet(newAddress) {
                setAddress(newAddress as Address);
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

      {/* Separator (conditional) */}
      {!isScam && (
        <Box paddingBottom="36px" width={{ custom: 166 }}>
          <Separator color="separatorTertiary" />
        </Box>
      )}

      {/* Scam Warning (conditional) */}
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
    </>
  );
}

// Define props for the new Footer component
interface AuthRequestFooterProps {
  auth: () => Promise<{ success: boolean; reason?: AuthRequestResponseErrorReason }>;
  accentColor: string;
}

// New Footer Component
export function AuthRequestFooter({ auth, accentColor }: AuthRequestFooterProps) {
  return (
    <Box alignItems="center">
      {/* Sign-in Button */}
      <ButtonPressAnimation onPress={auth}>
        <AccentColorProvider color={accentColor}>
          <BackgroundProvider color="accent">
            {({ backgroundColor }) => (
              <Box
                /* @ts-expect-error - backgroundColor weird typing */
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

      {/* Notice Text */}
      <Box paddingTop="24px" width={{ custom: 245 }}>
        <Text color={'labelQuaternary'} weight={'semibold'} size={'13pt'} align="center">
          {lang.t(lang.l.walletconnect.auth.signin_notice)}
        </Text>
      </Box>
    </Box>
  );
}
