import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import URL from 'url-parse';
import Divider from '../components/Divider';
import { RequestVendorLogoIcon } from '../components/coin-icon';
import { Centered, Row, RowWithMargins } from '../components/layout';
import { Sheet, SheetActionButton } from '../components/sheet';
import { Text } from '../components/text';
import { colors, padding } from '@rainbow-me/styles';

const WalletConnectApprovalSheet = () => {
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

  // Reject if the modal is dismissed
  useEffect(() => {
    return () => {
      if (!handled.current) {
        callback &&
          setTimeout(() => {
            callback(false);
          }, 300);
      }
    };
  });

  const handleConnect = useCallback(() => {
    handled.current = true;
    goBack();
    callback &&
      setTimeout(() => {
        callback(true);
      }, 300);
  }, [callback, goBack]);

  const handleCancel = useCallback(() => {
    handled.current = true;
    goBack();
    callback &&
      setTimeout(() => {
        callback(false);
      }, 300);
  }, [callback, goBack]);

  return (
    <Sheet hideHandle>
      <Centered direction="column" paddingHorizontal={19} paddingTop={17}>
        <RequestVendorLogoIcon
          backgroundColor="transparent"
          borderRadius={18}
          dappName={dappName || ''}
          imageUrl={imageUrl || ''}
          showLargeShadow
          size={60}
          style={{ marginBottom: 24 }}
        />
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
            textColor={colors.dark}
            color={colors.white}
            label="Cancel"
            onPress={handleCancel}
            size="big"
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
};

export default React.memo(WalletConnectApprovalSheet);
