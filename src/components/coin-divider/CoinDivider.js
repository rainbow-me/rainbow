import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompact';
import styled from 'styled-components/primitives';
import { View, Text } from 'react-native';
import { colors, fonts, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { deviceUtils } from '../../utils';
import { Icon } from '../icons';
import { Centered } from '../layout';
import Animated from 'react-native-reanimated';
import { Monospace } from '../text';

const marginLeft = 15;
const marginRight = 19;
const Wrapper = styled(View)`
  margin-top: 8px;
  margin-right: ${marginRight}px;
  margin-left: ${marginLeft}px;
  width: ${deviceUtils.dimensions.width - marginRight - marginLeft};
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const Container = styled(View)`
  height: 30px;
  background-color: ${colors.lightGrey};
  border-radius: 15px;
  align-items: center;
  padding: 0 10px;
  flex-direction: row;
  justify-content: space-between;
`;

const Header = styled(Text)`
  font-family: ${fonts.family.SFProText};
  letter-spacing: ${fonts.letterSpacing.tighter};
  font-size: ${fonts.size.lmedium};
  color: ${colors.blueGreyDark};
  font-weight: ${fonts.weight.semibold};
  width: 40px;
  opacity: 0.6;
`;


const CoinDivider = ({
  openSmallBalances,
  onChangeOpenBalances,
  balancesSum,
}) => (
    <Wrapper>
      <ButtonPressAnimation scaleTo={0.9} onPress={onChangeOpenBalances}>
        <Container>
          <Header style={{ marginRight: openSmallBalances ? 0 : -10 }}>
            {openSmallBalances ? `Less` : `All`}
          </Header>
          <Centered justify="end" style={position.sizeAsObject(19)}>
            <Centered
              flex={0}
              justify="end"
              style={{
                ...position.sizeAsObject(13),
                paddingBottom: openSmallBalances ? 0 : 1,
                paddingTop: openSmallBalances ? 0 : 0,
                position: 'absolute',
                right: 0,
                opacity: 0.6,
              }}
            >
              <Animated.View
                style={{ transform: [{ rotate: openSmallBalances ? '-90deg' : '0deg' }] }}
              >
                <Icon
                  color={colors.blueGreyDark}
                  name="caretThin"
                  width={13}
                />
              </Animated.View>
            </Centered>
          </Centered>
        </Container>
      </ButtonPressAnimation>
      <Monospace
        color="blueGreyDark"
        size="lmedium"
      >
        {balancesSum}
      </Monospace>
    </Wrapper>
  );

CoinDivider.propTypes = {
  openSmallBalances: PropTypes.bool,
  onChangeOpenBalances: PropTypes.func,
};

CoinDivider.height = 38;


export default CoinDivider;
