import { RouteProp, useRoute } from '@react-navigation/native';
import i18n from '@/languages';
import React, { useEffect } from 'react';
import { Centered } from '@/components/layout';
import { Sheet } from '@/components/sheet';
import { Text } from '@/components/text';
import { useNavigation } from '@/navigation/Navigation';
import { useAppState } from '@/hooks';
import styled from '@/styled-thing';
import { ThemeContextProps, useTheme } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
const BodyText = styled(Text).attrs(({ theme: { colors } }: { theme: ThemeContextProps }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.6),
  lineHeight: 'loosest',
  size: 'big',
}))({
  paddingBottom: 23,
  paddingTop: 4,
});

const emojisMap = {
  'connect': '🥳',
  'timedOut': '👻',
  'reject': '👻',
  'sign': '🥳',
  'sign-canceled': '👻',
  'transaction': '🥳',
  'transaction-canceled': '👻',
};

const titlesMap = {
  'connect': i18n.walletconnect.titles.connect(),
  'timedOut': i18n.walletconnect.titles.reject(),
  'reject': i18n.walletconnect.titles.reject(),
  'sign': i18n.walletconnect.titles.sign(),
  'sign-canceled': i18n.walletconnect.titles.sign_canceled(),
  'transaction': i18n.walletconnect.titles.transaction_sent(),
  'transaction-canceled': i18n.walletconnect.titles.transaction_canceled(),
};

function WalletConnectRedirectSheet() {
  const { colors } = useTheme();
  const { goBack } = useNavigation();
  const { appState } = useAppState();
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.WALLET_CONNECT_REDIRECT_SHEET>>();

  const type = params?.type;

  useEffect(() => {
    if (appState === 'background') {
      goBack();
    }
  }, [goBack, appState]);

  return (
    <Sheet hideHandle>
      <Centered direction="column" paddingTop={12} testID="wc-redirect-sheet">
        <Text letterSpacing="zero" size="h2">
          {emojisMap[type]}
        </Text>
        <Centered marginTop={9}>
          <Text color={colors.dark} size="big" weight="bold">
            {titlesMap[type]}
          </Text>
        </Centered>
        <BodyText color={colors.dark}>{i18n.walletconnect.go_back_to_your_browser()}</BodyText>
      </Centered>
    </Sheet>
  );
}

export default React.memo(WalletConnectRedirectSheet);
