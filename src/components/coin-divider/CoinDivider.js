import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { View, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { compose } from 'recompact';
import FastImage from 'react-native-fast-image';
import { colors, fonts, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { deviceUtils } from '../../utils';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { Monospace } from '../text';
import { withFabSendAction } from '../../hoc';
import Highlight from '../Highlight';
import RotationArrow from '../animations/RotationArrow';
import Caret from '../../assets/family-dropdown-arrow.png';

const marginLeft = 15;
const marginRight = 19;
const Wrapper = styled(View)`
  padding-right: ${marginRight}px;
  padding-left: ${marginLeft}px;
  width: ${deviceUtils.dimensions.width};
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 50px;
`;

const Container = styled(View)`
  margin-top: 4px;
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

const SettingIconWrap = styled(View)`
  opacity: 0.6;
`;

const SettingIcon = styled(FastImage)`
  height: 17px;
  width: 8px;
`;

const enhance = compose(
  withFabSendAction,
);

const CoinDivider = enhance(({
  openSmallBalances,
  onChangeOpenBalances,
  balancesSum,
  isCoinDivider,
}) => (
  <Wrapper>
    <Highlight highlight={isCoinDivider} />
    <ButtonPressAnimation scaleTo={0.9} onPress={onChangeOpenBalances}>
      <Container>
        <Header style={{ marginRight: openSmallBalances ? 5 : -5 }}>
          {openSmallBalances ? 'Less' : 'All'}
        </Header>
        <SettingIconWrap>
          <RotationArrow isOpen={openSmallBalances} startingPosition={0} endingPosition={-90}>
            <SettingIcon source={Caret} />
          </RotationArrow>
        </SettingIconWrap>
      </Container>
    </ButtonPressAnimation>
    {!openSmallBalances
        && <Monospace
          color="blueGreyDark"
          size="lmedium"
        >
          {balancesSum}
        </Monospace>
    }
  </Wrapper>
));

CoinDivider.propTypes = {
  balancesSum: PropTypes.string,
  onChangeOpenBalances: PropTypes.func,
  openSmallBalances: PropTypes.bool,
};

CoinDivider.height = 50;


export default CoinDivider;
