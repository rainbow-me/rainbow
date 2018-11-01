import { isString } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForPropTypes } from 'recompact';
import styled from 'styled-components/primitives';
import BalanceManagerLogo from '../../assets/balance-manager-avatar.png';
import { borders, colors, position, shadow } from '../../styles';
import { Centered } from '../layout';
import { ShadowStack } from '../shadow-stack';
import { Text } from '../text';
import CoinIcon from './CoinIcon';

const VendorLogoContainer = styled(Centered)`
  ${({ size }) => borders.buildCircle(size)}
  background-color: ${colors.dark};
  overflow: hidden;
`;

const VendorLogoImage = styled.Image`
  ${({ size }) => position.size(size)}
  resize-mode: contain;
`;

const buildInitialsForDappName = (dappName) => {
  if (!dappName || !isString(dappName)) return '?';
  return dappName.split(' ').map(n => n.charAt(0)).join('');
};

const RequestVendorLogoIcon = ({ dappName, imageUrl, size }) => (
  <ShadowStack
    {...borders.buildCircleAsObject(size)}
    shadows={[
      shadow.buildString(0, 4, 6, colors.alpha(colors.purple, 0.12)),
      shadow.buildString(0, 1, 3, colors.alpha(colors.purple, 0.24)),
    ]}
  >
    <VendorLogoContainer size={size}>
      {(dappName === 'Balance Manager') ? (
        <VendorLogoImage
          size={size}
          source={imageUrl}
        />
      ) : (
        <Text
          color="white"
          size="large"
          style={{ marginBottom: 2 }}
          weight="medium"
        >
          {buildInitialsForDappName(dappName)}
        </Text>
      )}
    </VendorLogoContainer>
  </ShadowStack>
);

RequestVendorLogoIcon.propTypes = {
  dappName: PropTypes.string.isRequired,
  imageUrl: PropTypes.string,
  size: PropTypes.number.isRequired,
};

RequestVendorLogoIcon.defaultProps = {
  imageUrl: BalanceManagerLogo,
  size: CoinIcon.size,
};

export default onlyUpdateForPropTypes(RequestVendorLogoIcon);
