import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import Animated, { Easing } from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import Caret from '../../assets/family-dropdown-arrow.png';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import Highlight from '../Highlight';
import { ShadowStack } from '../shadow-stack';
import { TruncatedText, Monospace } from '../text';
import RotationArrow from '../animations/RotationArrow';

const Wrapper = styled.View`
  height: 56px;
  width: 100%; 
  padding: 11px;
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
`;

const Image = styled.View`
  background-color: #ffd9fe;
  justify-content: center;
  border-radius: 10.3px;
`;

const FamilyImage = styled(FastImage)`
  border-radius: 10.3px;
`;

const LeftView = styled.View`
  align-items: center;
  flex-direction: row;
`;

const ArrowWrap = styled.View`
  padding-left: 9px;
  transform: scale(0.8);
`;

const SettingIcon = styled(FastImage)`
  height: 20px;
  width: 9px;
`;

class TokenListHeader extends React.Component {
  render() {
    dimension = this.props.isCoinRow ? 40 : 34;
    padding = this.props.isCoinRow ? 16 : 19;
    return (
      <ButtonPressAnimation
        scaleTo={0.96}
        onPress={() => {
          this.props.onHeaderPress();
        }}
      >
        <Wrapper style={{paddingLeft: padding, paddingRight: padding}}>
          <Highlight highlight={this.props.highlight} />
          <LeftView>
            <ShadowStack
              borderRadius={dimension/2}
              height={dimension}
              width={dimension}
              shadows={[
                [0, 4, 6, colors.dark, 0.04],
                [0, 1, 3, colors.dark, 0.08],
              ]}
              shouldRasterizeIOS
            >
              {(this.props.familyImage) ? (
                <FamilyImage
                  id={this.props.familyImage}
                  source={{ uri: this.props.familyImage }}
                  style={{height: dimension, width: dimension}}
                />
              ) : (
                <Image style={{height: dimension, width: dimension}}/>
              )}
            </ShadowStack>
            <TruncatedText
              style={{ paddingLeft: 9 }}
              lineHeight="normal"
              size="medium"
              weight="semibold"
            >
              {this.props.familyName}
            </TruncatedText>
            <ArrowWrap>
              <RotationArrow isOpen={this.props.isOpen} endingPosition={90}>
                <SettingIcon source={Caret} />
              </RotationArrow>
            </ArrowWrap>
          </LeftView>
          {!this.props.isOpen &&
            <Monospace
              color="blueGreyDark"
              size="lmedium"
            >
              {this.props.childrenAmount}
            </Monospace>
          }
        </Wrapper>
      </ButtonPressAnimation>
    );
  }
}

TokenListHeader.propTypes = {
  childrenAmount: PropTypes.number,
  familyImage: PropTypes.string,
  familyName: PropTypes.string,
  highlight: PropTypes.bool,
  isOpen: PropTypes.bool,
  onHeaderPress: PropTypes.func,
};

export default TokenListHeader;
