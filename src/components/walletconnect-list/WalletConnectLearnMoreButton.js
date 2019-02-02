import PropTypes from 'prop-types';
import React from 'react';
import { debounce } from 'lodash';
import { Linking } from 'react-native';
import { compose, pure, withHandlers } from 'recompact';
import { colors, padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import Divider from '../Divider';
import { Centered, Row } from '../layout';
import { Text } from '../text';

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
        <Divider
          color={colors.alpha(colors.blueGreyLight, 0.05)}
          inset={false}
        />
      </Centered>
    </ButtonPressAnimation>
  </Row>
);

WalletConnectLearnMoreButton.propTypes = {
  onPressLearnMore: PropTypes.func,
};

const openWalletConnectWebsite = () => Linking.openURL('https://walletconnect.org/');

export default compose(
  pure,
  withHandlers({ onPressLearnMore: () => debounce(openWalletConnectWebsite, 200) }),
)(WalletConnectLearnMoreButton);
