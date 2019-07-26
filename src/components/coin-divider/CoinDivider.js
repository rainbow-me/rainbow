import React from 'react';
import { pure } from 'recompact';
import styled from 'styled-components/primitives';
import { View, Text } from 'react-native';
import { colors, fonts } from '../../styles';
import { ButtonPressAnimation } from '../animations';

const Container = styled(View)`
  height: 30px;
  width: 55px;
  background-color: ${colors.lightGrey};
  border-radius: 15px;
  margin-left: 15px;
  margin-top: 8px;
  justify-content: center;
  padding: 0 10px;
`;

const Header = styled(Text)`
  font-family: ${fonts.family.SFProText};
  letter-spacing: ${fonts.letterSpacing.tighter};
  font-size: ${fonts.size.lmedium};
  color: ${colors.blueGreyDark};
  font-weight: ${fonts.weight.semibold};
  opacity: 0.6;
`;


const CoinDivider = () => (
  <ButtonPressAnimation scaleTo={0.96} >
    <Container>
      <Header>
        All
      </Header>
    </Container>
  </ButtonPressAnimation>
);

CoinDivider.height = 38;


export default CoinDivider;
