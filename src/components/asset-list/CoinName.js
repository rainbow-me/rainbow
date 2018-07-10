// import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors, fonts } from '../../styles';

const CoinName = styled.Text`
  font-family: ${fonts.family.SFProText};
  font-size: ${fonts.size.lmedium};
  color: ${colors.blueGreyDark};
  font-weight: ${fonts.weight.regular};
`;

export default CoinName;
