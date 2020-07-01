import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompact';
import { UniswapInvestmentCard } from '../investment-cards';
import { Centered } from '../layout';
import FloatingPanels from './FloatingPanels';
import { margin, position } from '@rainbow-me/styles';

const InvestmentExpandedState = ({ asset }) => (
  <Centered {...position.coverAsObject} flex={1} height="100%">
    <FloatingPanels flex={1}>
      <UniswapInvestmentCard
        css={margin(0)}
        isCollapsible={false}
        isExpandedState
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
