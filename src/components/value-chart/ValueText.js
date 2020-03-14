import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { View } from 'react-native';
import { colors, fonts } from '../../styles';
import { TruncatedText } from '../text';
import TrendIndicatorText from './TrendIndicatorText';
import { deviceUtils } from '../../utils';
import { Transition, Transitioning } from 'react-native-reanimated';

const HeadingTextStyles = {
  color: colors.dark,
  weight: 'bold',
};

const Title = styled(TruncatedText).attrs(HeadingTextStyles)`
  font-size: 30px;
  margin-bottom: 6.5px;
`;

const Header = styled(TruncatedText)`
  font-size: ${fonts.size.smedium};
  color: ${colors.alpha(colors.blueGreyDark, 0.5)};
  font-weight: ${fonts.weight.semibold};
`;

const transition = (
  <Transition.Together>
    <Transition.Out
      durationMs={220}
      type="slide-top"
      propagation="right"
      interpolation="easeInOut"
    />
    <Transition.In
      durationMs={200}
      delayMs={120}
      type="fade"
      propagation="left"
    />
  </Transition.Together>
);

class ValueText extends React.Component {
  static propTypes = {
    change: PropTypes.string,
    direction: PropTypes.bool,
    headerText: PropTypes.string,
  };

  state = {
    text: undefined,
  };

  updateValue = text => {
    this.ref.animateNextTransition();
    this.setState({ text });
  };

  render() {
    return (
      <View
        style={{
          height: 85,
          paddingLeft: 15,
          width: deviceUtils.dimensions.width,
        }}
      >
        <Transitioning.View
          ref={ref => (this.ref = ref)}
          transition={transition}
        >
          {this.state.text ? (
            <View>
              <Header>{this.props.headerText}</Header>
              <Title>${Number(this.state.text).toFixed(2)}</Title>
              <TrendIndicatorText direction={this.props.direction}>
                {Math.abs(Number(this.props.change))}%
              </TrendIndicatorText>
            </View>
          ) : (
            <>
              <Header>Downloading data...</Header>
              <Title>Loading...</Title>
            </>
          )}
        </Transitioning.View>
      </View>
    );
  }
}

export default ValueText;
