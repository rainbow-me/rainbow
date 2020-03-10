import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompact';
import { margin } from '../../styles';
import { UniswapInvestmentCard } from '../investment-cards';
import { Centered } from '../layout';
import FloatingPanels from './FloatingPanels';

const InvestmentExpandedState = ({ asset }) => (
  <Centered paddingHorizontal={19}>
    <FloatingPanels>
      <UniswapInvestmentCard
        css={margin(0)}
        isCollapsible={false}
        item={asset}
        width="100%"
      />
    </FloatingPanels>
  </Centered>
);

InvestmentExpandedState.propTypes = {
  asset: PropTypes.object,
};

export default pure(InvestmentExpandedState);
