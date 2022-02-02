import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { Text } from '../text';
import { colors } from '@rainbow-me/styles';

interface Props {
  type: 'availability' | 'expiration' | 'price';
  isRegistered?: boolean;
  price?: string;
  expiryDate?: string;
}

const SearchResultIndicator = ({
  type,
  isRegistered,
  price,
  expiryDate,
}: Props) => {
  let text: string | undefined, gradient: string[], textColor: string;
  switch (type) {
    case 'availability':
      if (isRegistered) {
        text = '😭 Taken';
        gradient = colors.gradients.transparentToLightOrange;
        textColor = colors.lightOrange;
      } else {
        text = '🥳 Available';
        gradient = colors.gradients.transparentToGreen;
        textColor = colors.green;
      }
      break;
    case 'expiration':
      text = `Til ${expiryDate}`; // fix when we have backend
      gradient = colors.gradients.transparentToLightGrey;
      textColor = colors.blueGreyDark;
      break;
    case 'price':
      text = price; // fix when we have backend
      gradient = colors.gradients.transparentToLightGrey;
      textColor = colors.blueGreyDark;
      break;
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
    padding-left: 15;
    padding-right: 15;
  `;

  return (
    <Gradient>
      <Text
        color={textColor}
        containsEmoji={type === 'availability'}
        size="20px"
        weight="heavy"
      >
        {text}
      </Text>
    </Gradient>
  );
};

export default SearchResultIndicator;
