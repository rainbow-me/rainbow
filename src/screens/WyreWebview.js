import { useRoute } from '@react-navigation/core';
import React, { Fragment, useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';
import styled from 'styled-components/primitives';
import Spinner from '../components/Spinner';
import { BackButton } from '../components/header';
import { Centered, Row } from '../components/layout';
import { Text } from '../components/text';
import { reserveWyreOrder } from '../handlers/wyre';
import { useAccountSettings } from '../hooks';
import { colors } from '../styles';

const HeaderTitle = styled(Text).attrs({
  align: 'center',
  color: colors.blueGreyDark,
  letterSpacing: 'roundedMedium',
  lineHeight: 'loose',
  opacity: 0.8,
  size: 'large',
  weight: 'bold',
})``;

const Header = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  height: 42;
  margin-bottom: 42;
  top: 24;
  width: 100%;
`;
export default function WyreWebview() {
  const { params } = useRoute();
  const [url, setUrl] = useState(null);
  const { accountAddress, network } = useAccountSettings();

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
        <BackButton />
        <Centered cover>
          <HeaderTitle>Add Cash</HeaderTitle>
        </Centered>
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
