import React from 'react';
import { Text } from '../text';
import { colors } from '@rainbow-me/styles';
import styled from 'styled-components';
import RadialGradient from 'react-native-radial-gradient';
import LinearGradient from 'react-native-linear-gradient';

export default Indicator = ({ type, isRegistered, price, expiryDate }) => {
  let text, containerWidth, gradient, textColor;
  switch (type) {
    case 'availability':
      if (isRegistered) {
        text = '😭 Taken';
        containerWidth = 110;
        gradient = colors.gradients.transparentToLightOrange;
        textColor = colors.lightOrange;
      } else {
        text = '🥳 Available';
        containerWidth = 140;
        gradient = colors.gradients.transparentToGreen;
        textColor = colors.green;
      }
      break;
    case 'expiration':
      text = `Til ${expiryDate}`; // fix when we have backend
      containerWidth = 210;
      gradient = colors.gradients.transparentToLightGrey;
      textColor = colors.blueGreyDark;
      break;
    case 'price':
      text = price; // fix when we have backend
      containerWidth = 110;
      gradient = colors.gradients.transparentToLightGrey;
      textColor = colors.blueGreyDark;
      break;
  }

  const IndicatorContainer = styled(LinearGradient).attrs(props => ({
    colors: gradient,
    start: { x: 0, y: 1 },
    end: { x: 1, y: 0 },
  }))`
    align-items: center;
    border-radius: 46;
    height: 40;
    justify-content: center;
    overflow: hidden;
    width: ${containerWidth};
  `;

  return (
    <IndicatorContainer>
      <Text
        color={textColor}
        containsEmoji={type === 'availability'}
        size="18px"
        weight="heavy"
      >
        {text}
      </Text>
    </IndicatorContainer>
  );
};
