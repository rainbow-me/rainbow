import React, { useEffect } from 'react';

import { useRoute, type RouteProp } from '@react-navigation/native';

import { Centered } from '@/components/layout';
import { Sheet } from '@/components/sheet';
import { Text } from '@/components/text';
import { opacity } from '@/design-system/utils/opacity';
import styled from '@/framework/ui/styled-thing';
import useAppState from '@/hooks/useAppState';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import type Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { useTheme, type ThemeContextProps } from '@/theme/ThemeContext';

const BodyText = styled(Text).attrs(({ theme: { colors } }: { theme: ThemeContextProps }) => ({
  align: 'center',
  color: opacity(colors.blueGreyDark, 0.6),
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
  get 'connect'() {
    return i18n.t(i18n.l.walletconnect.titles.connect);
  },
  get 'timedOut'() {
    return i18n.t(i18n.l.walletconnect.titles.reject);
  },
  get 'reject'() {
    return i18n.t(i18n.l.walletconnect.titles.reject);
  },
  get 'sign'() {
    return i18n.t(i18n.l.walletconnect.titles.sign);
  },
  get 'sign-canceled'() {
    return i18n.t(i18n.l.walletconnect.titles.sign_canceled);
  },
  get 'transaction'() {
    return i18n.t(i18n.l.walletconnect.titles.transaction_sent);
  },
  get 'transaction-canceled'() {
    return i18n.t(i18n.l.walletconnect.titles.transaction_canceled);
  },
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
        <BodyText color={colors.dark}>{i18n.t(i18n.l.walletconnect.go_back_to_your_browser)}</BodyText>
      </Centered>
    </Sheet>
  );
}

export default React.memo(WalletConnectRedirectSheet);
