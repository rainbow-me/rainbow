import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Row } from '../layout';
import { Rounded } from '../text';

const sx = StyleSheet.create({
  cents: {
    marginLeft: 1,
    top: 7,
  },
});

const DollarFigure = ({ value, decimals = 2 }) => {
  const [dollars, cents = '00'] = value.split('.');
  const formattedCents = cents.substr(0, decimals);
  return (
    <Row>
      <Rounded letterSpacing={0.2} size="h1" weight="heavy">
        {dollars.charAt(0) === '$' ? dollars : `$${dollars}`}
      </Rounded>
      <Rounded letterSpacing={0.1} size="large" style={sx.cents} weight="heavy">
        {`.${formattedCents}`}
      </Rounded>
    </Row>
  );
};

DollarFigure.propTypes = {
  decimals: PropTypes.number,
  value: PropTypes.string,
};

export default React.memo(DollarFigure);
