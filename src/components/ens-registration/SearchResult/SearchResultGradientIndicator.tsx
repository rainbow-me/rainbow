import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {
  AccentColorProvider,
  Box,
  Inset,
  Text,
} from '@rainbow-me/design-system';
import { useDimensions } from '@rainbow-me/hooks';
import { useTheme } from '@rainbow-me/theme';

type Props = {
  type: 'availability' | 'expiration' | 'price';
  isRegistered?: boolean;
  price?: string;
  expirationDate?: string;
};

const SearchResultGradientIndicator = ({
  type,
  isRegistered = false,
  price,
  expirationDate,
}: Props) => {
  const { colors } = useTheme();
  const { isSmallPhone } = useDimensions();
  let text: string | undefined, gradient: string[];
  switch (type) {
    case 'availability':
      if (isRegistered) {
        text = '😭 Taken';
        gradient = colors.gradients.transparentToLightOrange;
      } else {
        text = '🥳 Available';
        gradient = colors.gradients.transparentToGreen;
      }
      break;
    case 'expiration':
      text = `Til ${expirationDate}`;
      gradient = colors.gradients.transparentToLightGrey;
      break;
    case 'price':
      text = `${price} / Year`;
      gradient = colors.gradients.transparentToLightGrey;
      break;
  }

  return (
    <Box
      alignItems="center"
      as={LinearGradient}
      borderRadius={46}
      colors={gradient}
      end={{ x: 0.6, y: 0 }}
      height="40px"
      justifyContent="center"
      start={{ x: 0, y: 0.6 }}
    >
      <Inset horizontal="15px">
        <AccentColorProvider
          color={isRegistered ? colors.lightOrange : colors.green}
        >
          <Text
            color={type === 'availability' ? 'accent' : 'secondary80'}
            containsEmoji
            size={isSmallPhone ? '18px' : '20px'}
            weight="heavy"
          >
            {text}
          </Text>
        </AccentColorProvider>
      </Inset>
    </Box>
  );
};

export default SearchResultGradientIndicator;
