import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { Row } from '../layout';
import Text from './Text';

const Cents = styled(Text).attrs({
  align: 'right',
  letterSpacing: 'roundedTightest',
  size: 'large',
  weight: 'heavy',
})`
  top: 7;
`;

const DollarFigure = ({ value, decimals = 2 }) => {
  const [dollars, cents = '00'] = value.split('.');
  const formattedCents = cents.substr(0, decimals);
  return (
    <Row>
      <Text letterSpacing="zero" size="h1" weight="heavy">
        {dollars}
      </Text>
      <Cents>{`.${formattedCents}`}</Cents>
    </Row>
  );
};

DollarFigure.propTypes = {
  decimals: PropTypes.number,
  value: PropTypes.string,
};

export default React.memo(DollarFigure);
