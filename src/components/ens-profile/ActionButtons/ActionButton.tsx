import React from 'react';
import { ButtonProps } from 'react-native';
import { BackgroundColor } from '../../../design-system/color/palettes';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import {
  Box,
  Inset,
  Text,
  useForegroundColor,
} from '@rainbow-me/design-system';

type ActionButtonProps = {
  children?: string;
  color?: BackgroundColor | 'accent';
  icon?: string | React.ReactElement;
  onPress?: ButtonProps['onPress'];
  variant?: 'solid' | 'outlined';
  testID?: string;
};

export default function ActionButton({
  children,
  icon,
  onPress,
  variant = 'solid',
  testID,
}: ActionButtonProps) {
  const secondary10 = useForegroundColor('secondary10');

  const isIconOnly = Boolean(icon && !children);
  return (
    <ButtonPressAnimation onPress={onPress} testID={testID}>
      <Box
        alignItems="center"
        background="action"
        borderRadius={23}
        height="40px"
        justifyContent="center"
        {...(variant === 'solid' && {
          shadow: '30px medium action',
        })}
        {...(variant === 'outlined' && {
          background: 'body',
          shadow: undefined,
          style: {
            borderColor: secondary10,
            borderStyle: 'solid',
            borderWidth: 1.5,
          },
        })}
        {...(isIconOnly && {
          width: { custom: 40 },
        })}
      >
        <Inset horizontal={!isIconOnly ? '10px' : undefined}>
          {typeof icon !== 'string' && icon}
          {(typeof icon === 'string' || children) && (
            <Text
              color={variant === 'outlined' ? 'secondary80' : 'primary'}
              size="16px"
              weight="heavy"
            >
              {typeof icon === 'string' ? icon : ''}
              {children ? ` ${children}` : ''}
            </Text>
          )}
        </Inset>
      </Box>
    </ButtonPressAnimation>
  );
}
