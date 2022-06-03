import React, { ReactNode } from 'react';
import { ButtonProps } from 'react-native';
import { TextColor } from '../../design-system/typography/typography';
import ButtonPressAnimation from '../animations/ButtonPressAnimation';
import {
  AccentColorProvider,
  Box,
  Cover,
  Text,
  useForegroundColor,
} from '@rainbow-me/design-system';

const TintButton = ({
  children,
  disabled,
  onPress,
  color = 'secondary80',
  testID,
}: {
  children: ReactNode;
  disabled?: boolean;
  onPress: ButtonProps['onPress'];
  color?: TextColor;
  testID?: string;
}) => {
  const secondary06 = useForegroundColor('secondary06');

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
      style={{
        opacity: disabled ? 0.5 : 1,
        overflow: 'hidden',
      }}
      testID={testID}
    >
      <Cover>
        <AccentColorProvider color={secondary06}>
          <Box
            alignItems="center"
            background="accent"
            borderRadius={46}
            height={`${height}px`}
            justifyContent="center"
            width="full"
          />
        </AccentColorProvider>
      </Cover>
      <Text color={color} size="20px" weight="heavy">
        {children}
      </Text>
    </Box>
  );
};

export default TintButton;
