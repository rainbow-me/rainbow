import React from 'react';
import { pure } from 'recompact';
import styled from 'styled-components/primitives';
import { View, Text } from 'react-native';
import { colors, fonts } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { withOpenBalances } from '../../hoc';
import { deviceUtils } from '../../utils';

const Wrapper = styled(View)`
  width: ${deviceUtils.dimensions.width};
  flex-direction: row;
`;

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


const CoinDivider = ({
  openSmallBalances,
  setOpenSmallBalances,
}) => (
  <Wrapper>
    <ButtonPressAnimation scaleTo={0.9} onPress={() => {setOpenSmallBalances(!openSmallBalances)}}>
      <Container>
        <Header>
          { openSmallBalances ? `Less` : `All` }
        </Header>
      </Container>
    </ButtonPressAnimation>
  </Wrapper>
);

CoinDivider.height = 38;


export default withOpenBalances(CoinDivider);
