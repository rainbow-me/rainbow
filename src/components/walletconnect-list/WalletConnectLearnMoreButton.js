import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Linking } from 'react-native';
import { compose, pure, withHandlers } from 'recompact';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { Centered, Row } from '../layout';
import { Text } from '../text';
import { colors, padding } from '@rainbow-me/styles';

const WalletConnectLearnMoreButton = ({ onPressLearnMore }) => (
  <Row align="start">
    <ButtonPressAnimation
      activeOpacity={0.5}
      onPress={onPressLearnMore}
      scaleTo={0.96}
    >
      <Centered direction="column">
        <Text
          color="paleBlue"
          css={padding(6, 0)}
          size="lmedium"
          weight="semibold"
        >
          Learn More
        </Text>
        <Divider color={colors.rowDividerLight} inset={false} />
      </Centered>
    </ButtonPressAnimation>
  </Row>
);

WalletConnectLearnMoreButton.propTypes = {
  onPressLearnMore: PropTypes.func,
};

const openWalletConnectWebsite = () =>
  Linking.openURL('https://walletconnect.org/');

export default compose(
  pure,
  withHandlers({
    onPressLearnMore: () => debounce(openWalletConnectWebsite, 200),
  })
)(WalletConnectLearnMoreButton);
