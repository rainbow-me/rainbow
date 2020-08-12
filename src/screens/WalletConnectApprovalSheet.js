import { useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components/primitives';
import URL from 'url-parse';
import Divider from '../components/Divider';
import { RequestVendorLogoIcon } from '../components/coin-icon';
import { Centered, Row, RowWithMargins } from '../components/layout';
import { Sheet, SheetActionButton } from '../components/sheet';
import { Text } from '../components/text';
import { useNavigation } from '../navigation/Navigation';
import { colors, padding } from '@rainbow-me/styles';

const DappLogo = styled(RequestVendorLogoIcon).attrs({
  backgroundColor: colors.transparent,
  borderRadius: 18,
  showLargeShadow: true,
  size: 60,
})`
  margin-bottom: 24;
`;

export default function WalletConnectApprovalSheet() {
  // TODO set this to true via everest.link graph
  // if we can validate the host
  const authenticated = false;
  const { goBack } = useNavigation();
  const { params } = useRoute();
  const handled = useRef(false);
  const meta = params?.meta || {};
  const { dappName, dappUrl, imageUrl } = meta;
  const callback = params?.callback;

  const formattedDappUrl = useMemo(() => {
    const urlObject = new URL(dappUrl);
    return urlObject.hostname;
  }, [dappUrl]);

  const handleSuccess = useCallback(
    (success = false) => {
      if (callback) {
        setTimeout(() => callback(success), 300);
      }
    },
    [callback]
  );

  // Reject if the modal is dismissed
  useEffect(() => {
    return () => {
      if (!handled.current) {
        handleSuccess(false);
      }
    };
  });

  const handleConnect = useCallback(() => {
    handled.current = true;
    goBack();
    handleSuccess(true);
  }, [handleSuccess, goBack]);

  const handleCancel = useCallback(() => {
    handled.current = true;
    goBack();
    handleSuccess(false);
  }, [handleSuccess, goBack]);

  return (
    <Sheet hideHandle>
      <Centered direction="column" paddingHorizontal={19} paddingTop={17}>
        <DappLogo dappName={dappName || ''} imageUrl={imageUrl || ''} />
        <Centered paddingHorizontal={23}>
          <Row>
            <Text
              align="center"
              color={colors.alpha(colors.blueGreyDark, 0.6)}
              lineHeight={29}
              size="big"
            >
              <Text color="dark" size="big" weight="bold">
                {dappName}
              </Text>{' '}
              wants to connect to your wallet
            </Text>
          </Row>
        </Centered>
        <Row marginBottom={30} marginTop={15}>
          <Text color="appleBlue" lineHeight={29} size="large" weight="bold">
            {authenticated ? `􀇻 ${formattedDappUrl}` : formattedDappUrl}
          </Text>
        </Row>
        <Divider color={colors.rowDividerLight} inset={[0, 84]} />
        <RowWithMargins css={padding(24, 0, 21)} margin={15}>
          <SheetActionButton
            color={colors.white}
            label="Cancel"
            onPress={handleCancel}
            size="big"
            textColor={colors.dark}
          />
          <SheetActionButton
            color={colors.appleBlue}
            label="Connect"
            onPress={handleConnect}
            size="big"
          />
        </RowWithMargins>
      </Centered>
    </Sheet>
  );
}
