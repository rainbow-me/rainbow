import * as i18n from '@/languages';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { AccentColorProvider, Box, Inset, Text } from '@/design-system';
import { useDimensions } from '@/hooks';
import { useTheme } from '@/theme';

type Props = {
  type: 'availability' | 'expiration' | 'price';
  isRegistered?: boolean;
  price?: string;
  expirationDate?: string;
  testID?: string;
};

const SearchResultGradientIndicator = ({ type, isRegistered = false, price, expirationDate, testID }: Props) => {
  const { colors } = useTheme();
  const { isSmallPhone } = useDimensions();
  let text: string | undefined, gradient: string[];
  switch (type) {
    case 'availability':
      if (isRegistered) {
        text = i18n.t(i18n.l.profiles.search.taken);
        gradient = colors.gradients.transparentToLightOrange;
      } else {
        text = i18n.t(i18n.l.profiles.search.available);
        gradient = colors.gradients.transparentToGreen;
      }
      break;
    case 'expiration':
      text = `${i18n.t(i18n.l.profiles.search.expiration, {
        content: expirationDate as string,
      })}`;
      gradient = colors.gradients.transparentToLightGrey;
      break;
    case 'price':
      text = `${i18n.t(i18n.l.profiles.search.price, { content: price as string })}`;
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
      <Inset horizontal="15px (Deprecated)">
        <AccentColorProvider color={isRegistered ? colors.lightOrange : colors.green}>
          <Text
            color={type === 'availability' ? 'accent' : 'secondary80 (Deprecated)'}
            containsEmoji
            size={isSmallPhone ? '18px / 27px (Deprecated)' : '20px / 24px (Deprecated)'}
            testID={testID}
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
