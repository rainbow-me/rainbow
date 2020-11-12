import { useRoute } from '@react-navigation/core';
import { HeaderBackButton } from '@react-navigation/stack';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';
import styled from 'styled-components/primitives';
import Spinner from '../components/Spinner';
import { Centered, Row } from '../components/layout';
import { Text } from '../components/text';
import { reserveWyreOrder } from '../handlers/wyre';
import { useAccountSettings } from '../hooks';
import { colors } from '../styles';
import { useNavigation } from '@rainbow-me/navigation';

const HeaderTitle = styled(Text).attrs({
  align: 'left',
  color: colors.black,
  letterSpacing: 'roundedMedium',
  lineHeight: 'loose',
  opacity: 0.8,
  size: 'large',
  weight: 'bold',
})`
  margin-left: 15;
`;

const Header = styled(Row).attrs({
  align: 'center',
  backgroundColor: colors.white,
})`
  height: 42;
  margin-bottom: 42;
  top: 42;
  width: 100%;
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
    <Fragment>
      <Header>
        <HeaderBackButton onPress={handleBackButton} />
        <HeaderTitle>Add Cash</HeaderTitle>
      </Header>
      {url ? (
        <WebView
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
    </Fragment>
  );
}
