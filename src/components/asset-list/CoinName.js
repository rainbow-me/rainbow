// import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/native';
import { colors, fonts } from '../../styles';

const CoinName = styled.Text`
  font-family: ${fonts.family.SFProText};
  font-size: 16px;
  color: ${colors.blueGreyDark};
  font-weight: ${fonts.weight.normal};
`;

export default CoinName;
