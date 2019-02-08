import { isString } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { withProps } from 'recompact';
import styled from 'styled-components/primitives';
import BalanceManagerLogo from '../../assets/balance-manager-avatar.png';
import { colors, position, shadow } from '../../styles';
import { Centered } from '../layout';
import { ShadowStack } from '../shadow-stack';
import { Text } from '../text';
import CoinIcon from './CoinIcon';

const RequestVendorLogoIconBorderRadius = 16.25;

const DappNameInitials = withProps({
  color: 'white',
  size: 'large',
  weight: 'medium',
})(Text);

const VendorLogoContainer = styled(Centered)`
  ${({ size }) => position.size(size)}
  background-color: ${colors.dark};
  border-radius: ${({ borderRadius }) => borderRadius};
  overflow: hidden;
`;

const VendorLogo = styled.Image`
  ${({ size }) => position.size(size)}
  resize-mode: contain;
`;

const buildInitialsForDappName = (dappName) => (
  (!dappName || !isString(dappName))
    ? '?'
    : dappName.split(' ').map(n => n.charAt(0)).join('')
);

const RequestVendorLogoIcon = ({
  borderRadius,
  dappName,
  imageUrl,
  size,
}) => (
  <ShadowStack
    {...position.sizeAsObject(size)}
    borderRadius={borderRadius}
    shadows={[
      [0, 4, 6, colors.purple, 0.12],
      [0, 1, 3, colors.purple, 0.24],
    ]}
  >
    <VendorLogoContainer borderRadius={borderRadius} size={size}>
      {(dappName === 'Balance Manager')
        ? <VendorLogo size={size} source={imageUrl} />
        : (
          <DappNameInitials style={{ marginBottom: 2 }}>
            {buildInitialsForDappName(dappName)}
          </DappNameInitials>
        )}
    </VendorLogoContainer>
  </ShadowStack>
);

RequestVendorLogoIcon.propTypes = {
  borderRadius: PropTypes.number,
  dappName: PropTypes.string.isRequired,
  imageUrl: PropTypes.string,
  size: PropTypes.number.isRequired,
};

RequestVendorLogoIcon.defaultProps = {
  borderRadius: RequestVendorLogoIconBorderRadius,
  imageUrl: BalanceManagerLogo,
  size: CoinIcon.size,
};

RequestVendorLogoIcon.size = CoinIcon.size;

export default RequestVendorLogoIcon;
