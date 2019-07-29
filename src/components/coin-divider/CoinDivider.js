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


const Wrapper = styled(View)`
  width: ${deviceUtils.dimensions.width};
  flex-direction: row;
`;

const Container = styled(View)`
  height: 30px;
  background-color: ${colors.lightGrey};
  border-radius: 15px;
  margin-left: 15px;
  margin-top: 8px;
  align-items: center;
  padding: 0 10px;
  flex-direction: row;
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
  onChangeOpenBalances,
}) => (
    <Wrapper>
      <ButtonPressAnimation scaleTo={0.9} onPress={onChangeOpenBalances}>
        <Container>
          <Header>
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
    </Wrapper>
  );

CoinDivider.propTypes = {
  openSmallBalances: PropTypes.bool,
  onChangeOpenBalances: PropTypes.func,
};

CoinDivider.height = 38;


export default CoinDivider;
