import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { Text } from '../../text';
import { useTheme } from '@rainbow-me/context';
import { useDimensions } from '@rainbow-me/hooks';

type Props = {
  type: 'availability' | 'expiration' | 'price';
  isRegistered?: boolean;
  price?: string;
  expiryDate?: string;
};

const GradientBackground = styled(LinearGradient).attrs(({ colors }) => ({
  colors: colors,
  end: { x: 1, y: 0 },
  start: { x: 0, y: 1 },
}))`
  align-items: center;
  border-radius: 46;
  height: 40;
  justify-content: center;
  overflow: hidden;
  padding-left: 15;
  padding-right: 15;
`;

const SearchResultGradientIndicator = ({
  type,
  isRegistered,
  price,
  expiryDate,
}: Props) => {
  const { colors } = useTheme();
  const { isSmallPhone } = useDimensions();
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

  return (
    <GradientBackground colors={gradient}>
      <Text
        color={textColor}
        containsEmoji={type === 'availability'}
        size={isSmallPhone ? '18px' : '20px'}
        weight="heavy"
      >
        {text}
      </Text>
    </GradientBackground>
  );
};

export default SearchResultGradientIndicator;
