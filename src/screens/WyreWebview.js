import { useRoute } from '@react-navigation/core';
import { HeaderBackButton } from '@react-navigation/stack';
import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import styled from 'styled-components/primitives';
import Spinner from '../components/Spinner';
import { Centered, FlexItem, Row } from '../components/layout';
import { Text } from '../components/text';
import { reserveWyreOrder } from '../handlers/wyre';
import { useAccountSettings } from '../hooks';
import { colors } from '../styles';
import { useNavigation } from '@rainbow-me/navigation';

const Container = styled(FlexItem)`
  background-color: ${colors.white};
`;
const StyledWebView = styled(WebView)`
  background-color: ${colors.white};
`;
const HeaderTitle = styled(Text).attrs({
  align: 'center',
  color: colors.black,
  letterSpacing: 'roundedMedium',
  lineHeight: 'loose',
  opacity: 0.8,
  size: 'larger',
  weight: 'bold',
})`
  margin-left: -55px;
  width: 100%;
`;

const Header = styled(Row).attrs({
  align: 'center',
  backgroundColor: colors.white,
})`
  height: 56;
  margin-bottom: 24;
  top: 28;
  width: 100%;
  elevation: 24;
`;
export default function WyreWebview() {
  const { params } = useRoute();
  const { goBack } = useNavigation();
  const [url, setUrl] = useState(null);
  const { accountAddress, network } = useAccountSettings();

  const handleBackButton = useCallback(() => {
    goBack();
  }, [goBack]);

  useEffect(() => {
    StatusBar.setBackgroundColor('transparent', false);
    StatusBar.setTranslucent(true);
    StatusBar.setBarStyle('dark-content', true);
  }, []);

  useEffect(() => {
    const getReservationId = async () => {
      const { url } = await reserveWyreOrder(
        params.amount,
        'ETH',
        accountAddress,
        network,
        'debit-card'
      );
      setUrl(url);
    };
    getReservationId();
  }, [accountAddress, network, params.amount]);

  const defaultInputWidth = params.amount?.toString().length > 2 ? 180 : 140;

  return (
    <Container>
      <Header>
        <HeaderBackButton onPress={handleBackButton} />
        <HeaderTitle>Add Cash</HeaderTitle>
      </Header>
      {url ? (
        <StyledWebView
          injectedJavaScript={`
            document.getElementsByClassName('CloseBtn')[0].style.display = 'none';
            setTimeout(() => {
              document.getElementById('amount').style.width = '${defaultInputWidth}px';
              document.getElementsByName('termsAndConditions')[0].click();
            }, 500);
         `}
          injectedJavaScriptForMainFrameOnly={false}
          source={{ uri: url }}
        />
      ) : (
        <Centered flex={1}>
          <Spinner color={colors.appleBlue} size={30} />
        </Centered>
      )}
    </Container>
  );
}
