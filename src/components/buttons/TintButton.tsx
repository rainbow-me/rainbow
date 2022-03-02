import React, { ReactNode } from 'react';
import { ButtonProps } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { TextColor } from '../../design-system/typography/typography';
import ButtonPressAnimation from '../animations/ButtonPressAnimation';
import { useTheme } from '@rainbow-me/context';
import { Box, Cover, Text } from '@rainbow-me/design-system';

const TintButton = ({
  children,
  disabled,
  onPress,
  color = 'secondary80',
}: {
  children: ReactNode;
  disabled?: boolean;
  onPress: ButtonProps['onPress'];
  color: TextColor;
}) => {
  const { colors } = useTheme();

  const height = 56;

  return (
    <Box
      alignItems="center"
      as={ButtonPressAnimation}
      height={`${height}px`}
      justifyContent="center"
      // @ts-expect-error
      onPress={disabled ? () => undefined : onPress}
      scale={disabled ? 1 : 0.8}
      style={{ opacity: disabled ? 0.5 : 1, overflow: 'hidden' }}
    >
      <Cover>
        <Box
          alignItems="center"
          as={LinearGradient}
          borderRadius={46}
          colors={colors.gradients.transparentToLightGrey}
          end={{ x: 0.6, y: 0 }}
          height={`${height}px`}
          justifyContent="center"
          start={{ x: 0, y: 0.6 }}
          width="full"
        />
      </Cover>
      <Text color={color} size="20px" weight="heavy">
        {children}
      </Text>
    </Box>
  );
};

export default TintButton;
