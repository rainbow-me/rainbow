import PropTypes from 'prop-types';
import React from 'react';
import { colors, position } from '../../styles';
import { initials } from '../../utils';
import { Centered } from '../layout';
import { ShadowStack } from '../shadow-stack';
import { Text } from '../text';
import CoinIcon from './CoinIcon';

const RequestVendorLogoIconBorderRadius = 16.25;
const RequestVendorLogoIconShadows = [
  [0, 8, 11, colors.dark, 0.04],
  [0, 2, 6, colors.dark, 0.08],
];

const RequestVendorLogoIcon = ({
  backgroundColor,
  borderRadius,
  dappName,
  size,
  ...props
}) => (
  <ShadowStack
    {...props}
    {...position.sizeAsObject(size)}
    backgroundColor={backgroundColor}
    borderRadius={borderRadius}
    shadows={RequestVendorLogoIconShadows}
    shouldRasterizeIOS
  >
    <Centered style={{ ...position.sizeAsObject(size), backgroundColor }}>
      <Text
        color="white"
        size="large"
        style={{ marginBottom: 2 }}
        weight="medium"
      >
        {initials(dappName)}
      </Text>
    </Centered>
  </ShadowStack>
);

RequestVendorLogoIcon.propTypes = {
  backgroundColor: PropTypes.string,
  borderRadius: PropTypes.number,
  dappName: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
};

RequestVendorLogoIcon.defaultProps = {
  backgroundColor: colors.dark,
  borderRadius: RequestVendorLogoIconBorderRadius,
  size: CoinIcon.size,
};

RequestVendorLogoIcon.size = CoinIcon.size;

export default RequestVendorLogoIcon;
