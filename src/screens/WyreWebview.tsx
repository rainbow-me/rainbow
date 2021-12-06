import { useRoute } from '@react-navigation/core';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Spinner' was resolved to '/U... Remove this comment to see the full error message
import Spinner from '../components/Spinner';
import { Centered, FlexItem } from '../components/layout';
import { reserveWyreOrder } from '../handlers/wyre';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings } from '@rainbow-me/hooks';

const Container = styled(FlexItem)`
  background-color: ${({ theme: { colors } }) => colors.white};
`;
const StyledWebView = styled(WebView)`
  background-color: ${({ theme: { colors } }) => colors.white};
`;
export default function WyreWebview() {
  const { params } = useRoute();
  const [url, setUrl] = useState(null);
  const { accountAddress, network } = useAccountSettings();

  useEffect(() => {
    StatusBar.setBackgroundColor('transparent', false);
    StatusBar.setTranslucent(true);
    StatusBar.setBarStyle('dark-content', true);
  }, []);

  useEffect(() => {
    const getReservationId = async () => {
      const { url } = await reserveWyreOrder(
        // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
        params.amount,
        'ETH',
        accountAddress,
        network,
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '"debit-card"' is not assignable ... Remove this comment to see the full error message
        'debit-card'
      );
      setUrl(url);
    };
    getReservationId();
    // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
  }, [accountAddress, network, params.amount]);

  // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
  const defaultInputWidth = params.amount?.toString().length > 2 ? 180 : 140;

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container>
      {url ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <StyledWebView
          injectedJavaScript={`
            document.getElementsByClassName('CloseBtn')[0].style.display = 'none';
            setTimeout(() => {
              document.getElementById('amount').style.width = '${defaultInputWidth}px';
              document.getElementsByName('termsAndConditions')[0].click();
            }, 500);
         `}
          injectedJavaScriptForMainFrameOnly={false}
          // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
          source={{ uri: url }}
        />
      ) : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Centered flex={1}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Spinner color={colors.appleBlue} size={30} />
        </Centered>
      )}
    </Container>
  );
}
