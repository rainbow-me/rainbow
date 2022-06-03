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
  testID?: string;
};

export default function SelectableButton({
  children,
  onSelect,
  isSelected,
  testID,
}: SelectableButtonProps) {
  const secondary06 = useForegroundColor('secondary06');
  const secondary30 = useForegroundColor('secondary30');
  const accent = useForegroundColor('accent');
  const borderColor = isSelected ? accent : secondary06;
  const textColor = isSelected ? accent : secondary30;
  const height = 30;

  return (
    <AccentColorProvider color={textColor}>
      <Box
        as={ButtonPressAnimation}
        height={`${height}px`}
        // @ts-expect-error
        onPress={onSelect}
        testID={testID}
      >
        <Box
          alignItems="center"
          borderRadius={12}
          height={`${height}px`}
          justifyContent="center"
          paddingHorizontal="8px"
          style={{ borderColor: borderColor, borderWidth: 2 }}
        >
          <Text align="center" color="accent" size="16px" weight="heavy">
            {children}
          </Text>
        </Box>
      </Box>
    </AccentColorProvider>
  );
}
