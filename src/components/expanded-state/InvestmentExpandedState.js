import React from 'react';
import { margin, position } from '../../styles';
import { FloatingPanels } from '../floating-panels';
import { UniswapInvestmentCard } from '../investment-cards';
import { Centered } from '../layout';

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

export default React.memo(InvestmentExpandedState);
