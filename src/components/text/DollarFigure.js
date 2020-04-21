import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Row } from '../layout';
import Text from './Text';

const sx = StyleSheet.create({
  cents: { top: 7 },
});

const DollarFigure = ({ value, decimals = 2 }) => {
  const [dollars, cents = '00'] = value.split('.');
  const formattedCents = cents.substr(0, decimals);
  return (
    <Row>
      <Text letterSpacing="zero" size="h1" weight="heavy">
        {dollars}
      </Text>
      <Text
        align="right"
        letterSpacing="roundedTightest"
        size="large"
        style={sx.cents}
        weight="heavy"
      >
        {`.${formattedCents}`}
      </Text>
    </Row>
  );
};

DollarFigure.propTypes = {
  decimals: PropTypes.number,
  value: PropTypes.string,
};

export default React.memo(DollarFigure);
