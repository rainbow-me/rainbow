import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompact';
import { margin } from '../../styles';
import { UniswapInvestmentCard } from '../investment-cards';
import FloatingPanels from './FloatingPanels';

const InvestmentExpandedState = ({ asset }) => (
  <FloatingPanels>
    <UniswapInvestmentCard
      css={margin(0)}
      item={asset}
      width="100%"
    />
  </FloatingPanels>
);

InvestmentExpandedState.propTypes = {
  asset: PropTypes.object,
};

export default pure(InvestmentExpandedState);
