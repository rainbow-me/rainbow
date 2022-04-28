import React from 'react';
import { ButtonProps } from 'react-native';
import { BackgroundColor } from '../../../design-system/color/palettes';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import {
  AccentColorProvider,
  Box,
  Inset,
  Space,
  Text,
  useForegroundColor,
} from '@rainbow-me/design-system';

type ActionButtonProps = {
  children?: string;
  color?: BackgroundColor | 'accent';
  icon?: string | React.ReactElement;
  onPress?: ButtonProps['onPress'];
  paddingHorizontal?: Space;
  variant?: 'solid' | 'outlined';
  testID?: string;
};

export default function ActionButton({
  children,
  icon,
  onPress,
  paddingHorizontal = '12px',
  variant = 'solid',
  testID,
}: ActionButtonProps) {
  const appleBlue = useForegroundColor('action');
  const divider100 = useForegroundColor('divider100');
  const shadow = useForegroundColor('shadow');

  const shadowColor = useForegroundColor({
    custom: {
      dark: shadow,
      light: appleBlue,
    },
  });

  const isIconOnly = Boolean(icon && !children);
  return (
    <ButtonPressAnimation onPress={onPress} testID={testID}>
      <AccentColorProvider color={shadowColor}>
        <Box
          alignItems="center"
          background="action"
          borderRadius={18}
          height="36px"
          justifyContent="center"
          {...(variant === 'solid' && {
            shadow: '30px light accent',
          })}
          {...(variant === 'outlined' && {
            background: 'body',
            shadow: undefined,
            style: {
              borderColor: divider100,
              borderStyle: 'solid',
              borderWidth: 1.5,
            },
          })}
          {...(isIconOnly && {
            width: { custom: 36 },
          })}
        >
          <Inset horizontal={isIconOnly ? undefined : paddingHorizontal}>
            {typeof icon !== 'string' && icon}
            {(typeof icon === 'string' || children) && (
              <Text
                align="center"
                color={variant === 'outlined' ? 'secondary80' : 'primary'}
                size="15px"
                weight="heavy"
              >
                {icon || children}
              </Text>
            )}
          </Inset>
        </Box>
      </AccentColorProvider>
    </ButtonPressAnimation>
  );
}
