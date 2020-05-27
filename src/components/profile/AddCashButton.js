import MaskedView from '@react-native-community/masked-view';
import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import RadialGradient from 'react-native-radial-gradient';
import { withProps } from 'recompact';
import AddCashIconSource from '../../assets/addCashIcon.png';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { RowWithMargins } from '../layout';
import { Text } from '../text';

const BorderWidth = 1;
const ButtonHeight = 56;
const ButtonWidth = 155;
const InnerButtonHeight = ButtonHeight - BorderWidth * 2;
const InnerButtonWidth = ButtonWidth - BorderWidth * 2;
const BorderRadius = ButtonHeight / 2;

const sx = StyleSheet.create({
  buttonContainer: {
    height: ButtonHeight,
    width: ButtonWidth,
  },
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
  innerButton: {
    backgroundColor: colors.dark,
    borderRadius: BorderRadius - BorderWidth,
    height: InnerButtonHeight,
    margin: BorderWidth,
    width: InnerButtonWidth,
  },
  innerGradient: {
    height: ButtonWidth - BorderWidth * 2,
    overflow: 'hidden',
    position: 'absolute',
    top: -(InnerButtonWidth / 2 - InnerButtonHeight / 2),
    transform: [{ scaleY: 0.7884615385 }],
    width: InnerButtonWidth,
  },
  outerButton: {
    backgroundColor: colors.dark,
    borderRadius: BorderRadius,
    height: ButtonHeight,
    shadowColor: colors.dark,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 7.5,
    width: ButtonWidth,
  },
  outerGradient: {
    height: ButtonWidth * 2,
    left: -ButtonWidth / 2,
    position: 'absolute',
    top: -(ButtonWidth - ButtonHeight / 2),
    transform: [{ scaleY: 0.7884615385 }],
    width: ButtonWidth * 2,
  },
  shadow: {
    backgroundColor: colors.white,
    borderRadius: ButtonHeight,
    height: ButtonHeight,
    opacity: 0.2,
    position: 'absolute',
    shadowColor: colors.dark,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    width: ButtonWidth,
  },
});

const innerButton = <View style={sx.innerButton} />;
const outerButton = <View style={sx.outerButton} />;

const GradientStops = [0, 0.544872, 1];
const AddCashRadialGradient = withProps({
  radius: ButtonWidth,
  stops: GradientStops,
})(RadialGradient);

const InnerGradientCenter = [InnerButtonWidth, InnerButtonWidth / 2];
const InnerGradientColors = ['#FFB114', '#FF54BB', '#00F0FF'];
const InnerGradient = withProps({
  center: InnerGradientCenter,
  colors: InnerGradientColors,
  style: sx.innerGradient,
})(AddCashRadialGradient);

const OuterGradientCenter = [ButtonWidth * 1.5, ButtonWidth];
const OuterGradientColors = ['#F7AC13', '#F751B5', '#00E9F7'];
const OuterGradient = withProps({
  center: OuterGradientCenter,
  colors: OuterGradientColors,
  style: sx.outerGradient,
})(AddCashRadialGradient);

const AddCashButton = ({ onPress }) => (
  <ButtonPressAnimation marginTop={16} onPress={onPress} scaleTo={0.9}>
    <View style={sx.shadow} />
    <MaskedView maskElement={outerButton} pointerEvents="none">
      <View style={sx.buttonContainer}>
        <OuterGradient />
        <MaskedView maskElement={innerButton}>
          <InnerGradient />
        </MaskedView>
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
      </View>
    </MaskedView>
  </ButtonPressAnimation>
);

AddCashButton.propTypes = {
  onPress: PropTypes.func,
};

export default React.memo(AddCashButton);
