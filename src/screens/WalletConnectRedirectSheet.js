import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useEffect } from 'react';
import { Centered } from '../components/layout';
import { Sheet } from '../components/sheet';
import { Text } from '../components/text';
import { useNavigation } from '../navigation/Navigation';
import { useAppState } from '@/hooks';
import styled from '@/styled-thing';

const BodyText = styled(Text).attrs(({ theme: { colors } }) => ({
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
  'reject': '👻',
  'sign': '🥳',
  'sign-canceled': '👻',
  'transaction': '🥳',
  'transaction-canceled': '👻',
};

const titlesMap = {
  'connect': lang.t('walletconnect.titles.connect'),
  'reject': lang.t('walletconnect.titles.reject'),
  'sign': lang.t('walletconnect.titles.sign'),
  'sign-canceled': lang.t('walletconnect.titles.sign_canceled'),
  'transaction': lang.t('walletconnect.titles.transaction_sent'),
  'transaction-canceled': lang.t('walletconnect.titles.transaction_canceled'),
};

const WalletConnectRedirectSheet = () => {
  const { colors } = useTheme();
  const { goBack } = useNavigation();
  const { appState } = useAppState();
  const { params } = useRoute();

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
        <BodyText color={colors.dark}>{lang.t('walletconnect.go_back_to_your_browser')}</BodyText>
      </Centered>
    </Sheet>
  );
};

export default React.memo(WalletConnectRedirectSheet);
