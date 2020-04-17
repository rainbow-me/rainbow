import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import RadialGradient from 'react-native-radial-gradient';
import { withProps } from 'recompact';
import AddCashButtonBackgroundSource from '../../assets/addCashButtonBackground.png';
import AddCashIconSource from '../../assets/addCashIcon.png';
import { margin, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Centered, Row, RowWithMargins } from '../layout';
import { Text } from '../text';

const BorderRadius = 28;
const BorderWidth = 2;

const sx = StyleSheet.create({
  content: {
    alignSelf: 'center',
    height: '100%',
    marginRight: 9,
    paddingBottom: 4,
    zIndex: 1,
  },
  icon: {
    height: 45,
    marginTop: 7,
    width: 45,
  },
  innerGradient: {
    ...position.sizeAsObject('100%'),
    borderRadius: BorderRadius - BorderWidth,
    overflow: 'hidden',
  },
  outerGradient: {
    borderRadius: BorderRadius,
    height: 56,
    minWidth: 155,
    overflow: 'hidden',
    padding: BorderWidth,
  },
  shadow: {
    height: 154,
    opacity: 0.8,
    position: 'absolute',
    top: -40,
    width: 255,
  },
});

const GradientRadius = 155;
const GradientStops = [0, 0.635483871, 1];

const AddCashRadialGradient = withProps({
  radius: GradientRadius,
  stops: GradientStops,
})(RadialGradient);

const InnerGradientCenter = [GradientRadius, BorderRadius - BorderWidth];
const InnerGradientColors = ['#FFB114', '#FF54BB', '#00F0FF'];
const InnerGradient = withProps({
  center: InnerGradientCenter,
  colors: InnerGradientColors,
  style: sx.innerGradient,
})(AddCashRadialGradient);

const OuterGradientCenter = [GradientRadius, BorderRadius];
const OuterGradientColors = ['#FF6B14', '#FFAC54', '#38BBFF'];
const OuterGradient = withProps({
  center: OuterGradientCenter,
  colors: OuterGradientColors,
  style: sx.outerGradient,
})(AddCashRadialGradient);

const AddCashButton = ({ onPress }) => (
  <ButtonPressAnimation onPress={onPress} scaleTo={0.9} zIndex={-1}>
    <Row css={margin(16, 15, 30)} flex={0}>
      <Centered {...position.coverAsObject}>
        <FastImage
          resizeMode={FastImage.resizeMode.contain}
          source={AddCashButtonBackgroundSource}
          style={sx.shadow}
        />
      </Centered>
      <OuterGradient>
        <InnerGradient>
          <RowWithMargins align="center" margin={-2.5} style={sx.content}>
            <FastImage
              resizeMode={FastImage.resizeMode.contain}
              source={AddCashIconSource}
              style={sx.icon}
            />
            <Text
              color="white"
              letterSpacing="roundedTight"
              size="larger"
              weight="bold"
            >
              Add Cash
            </Text>
          </RowWithMargins>
        </InnerGradient>
      </OuterGradient>
    </Row>
  </ButtonPressAnimation>
);

AddCashButton.propTypes = {
  onPress: PropTypes.func,
};

export default React.memo(AddCashButton);
