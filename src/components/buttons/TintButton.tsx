import MaskedView from '@react-native-community/masked-view';
import React, { ReactNode } from 'react';
import { ButtonProps } from 'react-native';
import { TextColor } from '../../design-system/typography/typography';
import RadialGradientBackground from '../RadialGradientBackground';
import LinearGradient from 'react-native-linear-gradient';
import ButtonPressAnimation from '../animations/ButtonPressAnimation';
import { useTheme } from '@rainbow-me/context';
import { Box, Cover, Text } from '@rainbow-me/design-system';
import { useDimensions } from '@rainbow-me/hooks';

const TintButton = ({
  children,
  onPress,
  color = 'secondary80',
}: {
  children: ReactNode;
  onPress: ButtonProps['onPress'];
  color: TextColor;
}) => {
  const { width: deviceWidth } = useDimensions();
  const { colors } = useTheme();

  const height = 56;

  return (
    <Box
      alignItems="center"
      as={ButtonPressAnimation}
      height={`${height}px`}
      justifyContent="center"
      // @ts-expect-error
      onPress={onPress}
      style={{ overflow: 'hidden' }}
    >
      <Cover>
        <Box
          alignItems="center"
          as={LinearGradient}
          borderRadius={46}
          colors={colors.gradients.transparentToLightGrey}
          end={{ x: 0.6, y: 0 }}
          height={`${height}px`}
          width="full"
          justifyContent="center"
          start={{ x: 0, y: 0.6 }}
        />
      </Cover>
      <Text color={color} size="20px" weight="heavy">
        {children}
      </Text>
    </Box>
  );
};

export default TintButton;
