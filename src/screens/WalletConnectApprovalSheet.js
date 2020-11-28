import { useRoute } from '@react-navigation/native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InteractionManager } from 'react-native';
import styled from 'styled-components/primitives';
import Divider from '../components/Divider';
import { Alert } from '../components/alerts';
import { RequestVendorLogoIcon } from '../components/coin-icon';
import { Centered, Row, RowWithMargins } from '../components/layout';
import { Sheet, SheetActionButton } from '../components/sheet';
import { Text } from '../components/text';
import {
  getDappHostname,
  isDappAuthenticated,
} from '@rainbow-me/helpers/dappNameHandler';
import { useNavigation } from '@rainbow-me/navigation';
import { colors, padding } from '@rainbow-me/styles';
import { ethereumUtils } from '@rainbow-me/utils';

const DappLogo = styled(RequestVendorLogoIcon).attrs({
  backgroundColor: colors.transparent,
  borderRadius: 18,
  showLargeShadow: true,
  size: 60,
})`
  margin-bottom: 24;
`;

const ActionRowAndroid = styled.View`
  flex-direction: row;
  height: 101;
  justify-content: space-around;
  padding-top: 24;
  padding-left: 0;
  padding-right: 0;
  padding-bottom: 21;
`;
const ActionRowIOS = styled(RowWithMargins).attrs({
  css: padding(24, 0, 21),
  margin: 15,
})`
  padding-top: 24;
  padding-left: 0;
  padding-right: 0;
  padding-bottom: 21;
`;

const ActionRow = android ? ActionRowAndroid : ActionRowIOS;

export default function WalletConnectApprovalSheet() {
  const { goBack } = useNavigation();
  const { params } = useRoute();
  const [scam, setScam] = useState(false);
  const handled = useRef(false);
  const meta = params?.meta || {};
  const { dappName, dappUrl, imageUrl } = meta;
  const callback = params?.callback;

  const checkIfScam = useCallback(
    async dappUrl => {
      const isScam = await ethereumUtils.checkIfUrlIsAScam(dappUrl);
      if (isScam) {
        Alert({
          buttons: [
            {
              text: 'Proceed Anyway',
            },
            {
              onPress: () => setScam(true),
              style: 'cancel',
              text: 'Ignore this request',
            },
          ],
          message:
            'We found this website in a list of malicious crypto scams.\n\n We recommend you to ignore this request and stop using this website immediately',
          title: ' 🚨 Heads up! 🚨',
        });
      }
    },
    [setScam]
  );

  const isAuthenticated = useMemo(() => {
    return isDappAuthenticated(dappUrl);
  }, [dappUrl]);

  const formattedDappUrl = useMemo(() => {
    return getDappHostname(dappUrl);
  }, [dappUrl]);

  const handleSuccess = useCallback(
    (success = false) => {
      if (callback) {
        setTimeout(() => callback(success), 300);
      }
    },
    [callback]
  );

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      checkIfScam(dappUrl);
    });
    // Reject if the modal is dismissed
    return () => {
      if (!handled.current) {
        handleSuccess(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    if (scam) {
      handleCancel();
    }
  }, [handleCancel, scam]);

  return (
    <Sheet hideHandle>
      <Centered
        direction="column"
        paddingBottom={android ? 10 : null}
        paddingHorizontal={19}
        paddingTop={17}
      >
        <DappLogo dappName={dappName || ''} imageUrl={imageUrl} />
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
            {isAuthenticated ? `􀇻 ${formattedDappUrl}` : formattedDappUrl}
          </Text>
        </Row>
        <Divider color={colors.rowDividerLight} inset={[0, 84]} />
        <ActionRow {...(android && { width: 310 })}>
          <SheetActionButton
            androidWidth={130}
            color={colors.white}
            isTransparent={ios}
            label="Cancel"
            onPress={handleCancel}
            radiusAndroid={24}
            size="big"
            textColor={colors.dark}
          />
          <SheetActionButton
            androidWidth={130}
            color={colors.appleBlue}
            label="Connect"
            onPress={handleConnect}
            radiusAndroid={24}
            size="big"
          />
        </ActionRow>
      </Centered>
    </Sheet>
  );
}
