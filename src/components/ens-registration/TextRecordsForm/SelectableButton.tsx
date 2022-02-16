import React, { ReactNode } from 'react';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import {
  AccentColorProvider,
  Box,
  Text,
  useForegroundColor,
} from '@rainbow-me/design-system';

type SelectableButtonProps = {
  children: ReactNode;
  onSelect: () => void;
  isSelected: boolean;
};

export default function SelectableButton({
  children,
  onSelect,
  isSelected,
}: SelectableButtonProps) {
  const secondary30 = useForegroundColor('secondary30');
  const accent = useForegroundColor('accent');
  const buttonColor = isSelected ? accent : secondary30;
  const height = 30;

  return (
    <AccentColorProvider color={buttonColor}>
      <Box
        as={ButtonPressAnimation}
        height={`${height}px`}
        // @ts-expect-error
        onPress={onSelect}
      >
        <Box
          alignItems="center"
          borderRadius={12}
          height={`${height}px`}
          justifyContent="center"
          paddingHorizontal="8px"
          style={{ borderColor: buttonColor, borderWidth: 2 }}
        >
          <Text color={{ custom: buttonColor }} size="16px" weight="heavy">
            {children}
          </Text>
        </Box>
      </Box>
    </AccentColorProvider>
  );
}
