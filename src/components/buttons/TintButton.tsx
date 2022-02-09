import MaskedView from '@react-native-community/masked-view';
import React, { ReactNode } from 'react';
import { ButtonProps } from 'react-native';
import RadialGradientBackground from '../RadialGradientBackground';
import ButtonPressAnimation from '../animations/ButtonPressAnimation';
import { useTheme } from '@rainbow-me/context';
import { TextColor } from '../../design-system/typography/typography';
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
          as={MaskedView}
          maskElement={
            <Box
              background="body"
              borderRadius={46}
              height={`${height}px`}
              width="full"
            />
          }
          style={{ height: '100%', width: '100%' }}
        >
          <RadialGradientBackground
            colors={colors.gradients.lighterGrey}
            height={height}
            stops={[1, 0]}
            width={deviceWidth}
          />
        </Box>
      </Cover>
      <Text color={color} size="20px" weight="heavy">
        {children}
      </Text>
    </Box>
  );
};

export default TintButton;
