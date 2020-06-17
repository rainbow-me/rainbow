import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives/dist/styled-components-primitives.esm';
import CoinDividerOpenButton from '../coin-divider/CoinDividerOpenButton';

const coinDividerHeight = 30;

const Wrapper = styled.View`
  margin-left: 16px;
`;

const SendAssetListSmallBalancesHeader = ({ onPress, openShitcoins }) => {
  return (
    <Wrapper>
      <CoinDividerOpenButton
        coinDividerHeight={coinDividerHeight}
        initialState
        isSmallBalancesOpen={openShitcoins}
        onPress={onPress}
      />
    </Wrapper>
  );
};

SendAssetListSmallBalancesHeader.propTypes = {
  onPress: PropTypes.bool,
  openShitcoins: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default React.memo(SendAssetListSmallBalancesHeader);
