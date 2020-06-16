import React, { useCallback, useEffect, useMemo } from 'react';
import { useNavigation } from 'react-navigation-hooks';
import URL from 'url-parse';
import { RequestVendorLogoIcon } from '../components/coin-icon';
import { Centered, Row, RowWithMargins } from '../components/layout';
import { Sheet, SheetActionButton } from '../components/sheet';
import { Text } from '../components/text';
import { useAppState } from '../hooks';

import { colors, padding } from '../styles';

const WalletConnectApprovalSheet = () => {
  // TODO set this to true via everest.link graph
  // if we can validate the host
  const authenticated = false;
  const { goBack, getParam } = useNavigation();
  const { appState } = useAppState();
  const { dappName, dappUrl, imageUrl } = getParam('meta');
  const callback = getParam('callback');
  const formattedDappUrl = useMemo(() => {
    const urlObject = new URL(dappUrl);
    return urlObject.hostname;
  }, [dappUrl]);

  const handleConnect = useCallback(() => {
    goBack();
    callback &&
      setTimeout(() => {
        callback();
      }, 300);
  }, [callback, goBack]);

  const handleCancel = useCallback(() => {
    goBack();
  }, [goBack]);

  useEffect(() => {
    if (appState === 'background') {
      goBack();
    }
  }, [goBack, appState]);

  return (
    <Sheet>
      <Centered
        direction="column"
        paddingTop={20}
        paddingLeft={20}
        paddingRight={20}
      >
        <RequestVendorLogoIcon
          backgroundColor="transparent"
          dappName={dappName || ''}
          imageUrl={imageUrl || ''}
          size={60}
          style={{ marginBottom: 24 }}
        />
        <Centered paddingLeft={20} paddingRight={20}>
          <Row>
            <Text
              size="big"
              weight="normal"
              align="center"
              color="blueGreyDark50"
            >
              <Text size="big" weight="bold" color="dark">
                {dappName}
              </Text>{' '}
              wants to connect to your wallet
            </Text>
          </Row>
        </Centered>
        <Row marginTop={15} marginBottom={30}>
          <Text size="large" weight="bold" color="appleBlue">
            {authenticated ? `􀇻 ${formattedDappUrl}` : formattedDappUrl}
          </Text>
        </Row>
        <RowWithMargins css={padding(24, 15)} margin={15}>
          <SheetActionButton
            textColor={colors.blueGreyDark}
            color={colors.white}
            label="Cancel"
            onPress={handleCancel}
          />
          <SheetActionButton
            color={colors.appleBlue}
            label="Connect"
            onPress={handleConnect}
          />
        </RowWithMargins>
      </Centered>
    </Sheet>
  );
};

export default React.memo(WalletConnectApprovalSheet);
