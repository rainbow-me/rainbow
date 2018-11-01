import { distanceInWordsStrict } from 'date-fns';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, hoistStatics, onlyUpdateForKeys, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../styles';
import { Button } from '../buttons';
import { RequestVendorLogoIcon } from '../coin-icon';
import { Column, Row } from '../layout';
import { Text, TruncatedText } from '../text';

const ContainerPadding = 15;
const VendorLogoIconSize = 50;

const Container = styled(Row).attrs({ align: 'center' })`
  ${padding(ContainerPadding)}
`;

const Content = styled(Column)`
  ${padding(0, 18, 0, 12)}
`;

const DisconnectButton = styled(Button)`
  ${padding(8, 12.5, 10, 12.5)}
`;

const ExpiresText = styled(Text).attrs({ size: 'medium' })`
  color: ${colors.alpha(colors.blueGreyDark, 0.60)};
  margin-top: 3.5;
`;

const WalletConnectListItem = ({
  dappName,
  expires,
  onPress,
}) => (
  <Container>
    <RequestVendorLogoIcon
      dappName={dappName}
      size={VendorLogoIconSize}
    />
    <Content flex={1}>
      <TruncatedText color="dark" size="lmedium">
        {dappName}
      </TruncatedText>
      <ExpiresText>
        Expires in {distanceInWordsStrict(Date.now(), expires)}
      </ExpiresText>
    </Content>
    <DisconnectButton
      bgColor={colors.primaryBlue}
      onPress={onPress}
      textProps={{ size: 'smedium' }}
    >
      Connected
    </DisconnectButton>
  </Container>
);

WalletConnectListItem.propTypes = {
  dappName: PropTypes.string.isRequired,
  expires: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  onPress: PropTypes.func.isRequired,
};

WalletConnectListItem.height = VendorLogoIconSize + (ContainerPadding * 2);

export default hoistStatics(compose(
  onlyUpdateForKeys(['expires']),
  withHandlers({
    onPress: ({ onPress, _sessionId }) => () => onPress(_sessionId),
  }),
))(WalletConnectListItem);
