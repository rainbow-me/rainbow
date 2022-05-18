import React, { ReactNode, useMemo } from 'react';
import { ButtonProps } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { TextColor } from '../../design-system/typography/typography';
import ButtonPressAnimation from '../animations/ButtonPressAnimation';
import { Box, Cover, Text } from '@rainbow-me/design-system';
import { useTheme } from '@rainbow-me/theme';

const TintButton = ({
  children,
  onPress,
  color = 'secondary80',
}: {
  children: ReactNode;
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
      onPress={onPress}
      style={useMemo(() => ({ overflow: 'hidden' as 'hidden' }), [])}
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
