import PropTypes from 'prop-types';
import React from 'react';
import { TruncatedText } from '../text';

const CoinName = ({ paddingRight, ...props }) => (
  <TruncatedText
    color="blueGreyDark"
    size="lmedium"
    style={{ paddingRight }}
    {...props}
  />
);

CoinName.propTypes = {
  paddingRight: PropTypes.number,
};

CoinName.defaultProps = {
  paddingRight: 19,
};

export default CoinName;
