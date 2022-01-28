import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { Text } from '../text';
import { colors } from '@rainbow-me/styles';

interface Props {
  type: string;
  isRegistered: boolean;
  price: string;
  expiryDate: string;
}

const SearchResultIndicator = ({
  type,
  isRegistered,
  price,
  expiryDate,
}: Props) => {
  let text: string,
    containerWidth: number,
    gradient: string[],
    textColor: string;
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
    default:
      return;
  }

  const Gradient = styled(LinearGradient).attrs({
    colors: gradient,
    end: { x: 1, y: 0 },
    start: { x: 0, y: 1 },
  })`
    align-items: center;
    border-radius: 46;
    height: 40;
    justify-content: center;
    overflow: hidden;
    width: ${containerWidth};
  `;

  return (
    <Gradient>
      <Text
        color={textColor}
        containsEmoji={type === 'availability'}
        size="18px"
        weight="heavy"
      >
        {text}
      </Text>
    </Gradient>
  );
};

export default SearchResultIndicator;
