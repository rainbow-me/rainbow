import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys } from 'recompact';
import styled from 'styled-components/primitives';
import BalanceManagerLogo from '../../assets/balance-manager-logo.png';
import { borders, colors, position, shadow } from '../../styles';
import { Centered } from '../layout';
import { ShadowStack } from '../shadow-stack';
import CoinIcon from './CoinIcon';

const VendorLogoContainer = styled(Centered)`
  ${borders.buildCircle(CoinIcon.size)}
  background-color: ${colors.black};
  overflow: hidden;
`;

const VendorLogoImage = styled.Image`
  ${({ size }) => position.size(size)}
  resize-mode: contain;
`;

const RequestVendorLogoIcon = ({ imageUrl, size }) => (
  <ShadowStack
    {...borders.buildCircleAsObject(CoinIcon.size)}
    shadows={[
      shadow.buildString(0, 4, 6, colors.alpha(colors.purple, 0.12)),
      shadow.buildString(0, 1, 3, colors.alpha(colors.purple, 0.24)),
    ]}
  >
    <VendorLogoContainer>
      <VendorLogoImage size={size} source={imageUrl} />
    </VendorLogoContainer>
  </ShadowStack>
);

RequestVendorLogoIcon.propTypes = {
  imageUrl: PropTypes.string,
  size: PropTypes.number,
};

RequestVendorLogoIcon.defaultProps = {
  imageUrl: BalanceManagerLogo,
};

export default onlyUpdateForKeys(['imageUrl'])(RequestVendorLogoIcon);
