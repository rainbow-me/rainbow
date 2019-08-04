import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { View, Text } from 'react-native';
import { compose } from 'recompact';
import FastImage from 'react-native-fast-image';
import { colors, fonts } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { deviceUtils } from '../../utils';
import { Monospace } from '../text';
import { withFabSendAction } from '../../hoc';
import Highlight from '../Highlight';
import RotationArrow from '../animations/RotationArrow';
import Caret from '../../assets/show-all-arrow.png';
import OpacityToggler from '../animations/OpacityToggler';

const marginLeft = 19;
const marginRight = 19;
const Wrapper = styled(View)`
  margin: 8px 0 0 0;
  padding-right: ${marginRight}px;
  padding-left: ${marginLeft}px;
  width: ${deviceUtils.dimensions.width};
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 30px;
`;

const Container = styled(View)`
  height: 30px;
  background-color: ${colors.lightBlueGrey};
  border-radius: 15px;
  align-items: center;
  padding: 0 10px;
  flex-direction: row;
  justify-content: space-between;
`;

const Header = styled(Text)`
  color: ${colors.blueGreyDark};
  font-family: ${fonts.family.SFProText};
  font-size: ${fonts.size.lmedium};
  font-weight: ${fonts.weight.semibold};
  letter-spacing: ${fonts.letterSpacing.tighter};
  opacity: 0.6;
  padding-bottom: 1;
`;

const SettingIconWrap = styled(View)`
  opacity: 0.6;
  padding-bottom: 1;
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
    <ButtonPressAnimation scaleTo={0.8} onPress={onChangeOpenBalances}>
      <Container>
        <OpacityToggler isVisible={openSmallBalances}>
          <Header style={{ marginRight: -40 }}>
            All
          </Header>
        </OpacityToggler>
        <OpacityToggler isVisible={openSmallBalances} startingOpacity={0} endingOpacity={1}>
          <Header style={{ marginRight: openSmallBalances ? 10 : -10 }}>
            Less
          </Header>
        </OpacityToggler>
        <SettingIconWrap style={{ paddingRight: openSmallBalances ? 5 : 0.5 }}>
          <RotationArrow isOpen={openSmallBalances} startingPosition={0} endingPosition={-90}>
            <SettingIcon source={Caret} />
          </RotationArrow>
        </SettingIconWrap>
      </Container>
    </ButtonPressAnimation>
    <OpacityToggler isVisible={openSmallBalances}>
      <Monospace
        color="dark"
        size="lmedium"
        style={{ paddingBottom: 1 }}
      >
        {balancesSum}
      </Monospace>
    </OpacityToggler>
  </Wrapper>
));

CoinDivider.propTypes = {
  balancesSum: PropTypes.string,
  onChangeOpenBalances: PropTypes.func,
  openSmallBalances: PropTypes.bool,
};

CoinDivider.height = 30;


export default CoinDivider;
